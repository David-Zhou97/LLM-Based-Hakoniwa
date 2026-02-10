import { EvaluatorDefinition, PassageDefinition, GardenDefinition } from '../../../shared/types/garden.js';
import { SessionState, PlayerChoice } from '../../../shared/types/session.js';
import { StoryDefinition } from '../../../shared/types/story.js';
import { EvaluatorResult } from './DialogueEvaluator.js';
import { ConditionParser } from './ConditionParser.js';
import { ScoringMatrix } from './ScoringMatrix.js';

export interface TransferEvent {
  type: 'passage_available' | 'passage_closed' | 'narrative_hint' | 'var_updated';
  payload: Record<string, unknown>;
}

export class TransferEngine {
  private conditionParser: ConditionParser;

  constructor() {
    this.conditionParser = new ConditionParser();
  }

  /**
   * Process evaluator results and update session state.
   * Returns events that should be pushed to the frontend.
   */
  processEvaluatorResults(
    evaluatorResult: EvaluatorResult,
    garden: GardenDefinition,
    story: StoryDefinition,
    session: SessionState
  ): { updatedSession: SessionState; events: TransferEvent[] } {
    const events: TransferEvent[] = [];
    let updatedSession = { ...session };

    // 1. Process each evaluator result where value is true
    for (const evaluator of garden.evaluators) {
      const result = evaluatorResult.evaluator_results[evaluator.id];
      if (!result) continue;

      // Execute on_true actions
      if (evaluator.on_true.set_var) {
        updatedSession.variables = {
          ...updatedSession.variables,
          ...evaluator.on_true.set_var,
        };
      }

      if (evaluator.on_true.increment_score) {
        updatedSession.scoring_matrix = ScoringMatrix.applyIncrements(
          updatedSession.scoring_matrix,
          evaluator.on_true.increment_score
        );
      }

      if (evaluator.on_true.unlock_passage) {
        const passageId = evaluator.on_true.unlock_passage;
        if (!updatedSession.unlocked_passages.includes(passageId)) {
          updatedSession.unlocked_passages = [
            ...updatedSession.unlocked_passages,
            passageId,
          ];
          const passage = garden.passages.find(p => p.id === passageId);
          if (passage) {
            events.push({
              type: 'passage_available',
              payload: { passage_id: passageId, label: passage.label, is_new: true },
            });
          }
        }
      }

      if (evaluator.on_true.close_passage) {
        const passageId = evaluator.on_true.close_passage;
        if (!updatedSession.closed_passages.includes(passageId)) {
          updatedSession.closed_passages = [
            ...updatedSession.closed_passages,
            passageId,
          ];
          events.push({
            type: 'passage_closed',
            payload: { passage_id: passageId },
          });
        }
      }

      if (evaluator.on_true.emit_hint) {
        events.push({
          type: 'narrative_hint',
          payload: { hint: evaluator.on_true.emit_hint },
        });
      }
    }

    // 2. Apply narrative flag effects to scoring matrix
    if (evaluatorResult.narrative_flags.length > 0) {
      updatedSession.scoring_matrix = ScoringMatrix.applyFlags(
        updatedSession.scoring_matrix,
        evaluatorResult.narrative_flags,
        story.narrative_flag_effects
      );
    }

    // 3. Re-evaluate ALL passage conditions for current garden
    const previouslyUnlocked = new Set(session.unlocked_passages);
    for (const passage of garden.passages) {
      if (updatedSession.closed_passages.includes(passage.id)) continue;

      const conditionMet = this.conditionParser.evaluate(passage.condition, updatedSession);
      if (conditionMet && !previouslyUnlocked.has(passage.id)) {
        if (!updatedSession.unlocked_passages.includes(passage.id)) {
          updatedSession.unlocked_passages.push(passage.id);
          events.push({
            type: 'passage_available',
            payload: { passage_id: passage.id, label: passage.label, is_new: true },
          });
        }
      }
    }

    // Log evaluator results
    updatedSession.evaluator_log = [
      ...updatedSession.evaluator_log,
      {
        turn: updatedSession.turn_count_global,
        garden: garden.garden_id,
        results: evaluatorResult.evaluator_results,
        timestamp: new Date().toISOString(),
      },
    ];

    return { updatedSession, events };
  }

  /**
   * Get the list of currently available passages for the player.
   */
  getAvailablePassages(
    garden: GardenDefinition,
    session: SessionState
  ): PassageDefinition[] {
    return garden.passages.filter(passage => {
      if (session.closed_passages.includes(passage.id)) return false;
      return this.conditionParser.evaluate(passage.condition, session);
    });
  }

  /**
   * Convert available passages to player navigation choices.
   */
  getNavigationChoices(
    garden: GardenDefinition,
    session: SessionState
  ): PlayerChoice[] {
    const passages = this.getAvailablePassages(garden, session);
    return passages.map(p => ({
      id: `nav_${p.id}`,
      text: p.label,
      type: 'navigate' as const,
      passage_id: p.id,
    }));
  }
}
