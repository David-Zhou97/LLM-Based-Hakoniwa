import { EvaluatorDefinition } from '../../../shared/types/garden.js';
import { SessionState } from '../../../shared/types/session.js';
import { LLMProvider } from '../llm/LLMProvider.js';

export interface EvaluatorResult {
  evaluator_results: Record<string, boolean>;
  extracted_info: string[];
  npc_attitude_delta: Record<string, { from: string; to: string }>;
  narrative_flags: string[];
}

export class DialogueEvaluator {
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  async evaluate(
    gardenId: string,
    evaluators: EvaluatorDefinition[],
    playerMessage: string,
    npcResponse: string,
    session: SessionState,
    recentHistorySummary: string
  ): Promise<EvaluatorResult> {
    // Handle turn_count evaluators locally (no LLM needed)
    const turnCountResults: Record<string, boolean> = {};
    const semanticEvaluators: EvaluatorDefinition[] = [];

    for (const evaluator of evaluators) {
      if (evaluator.method === 'turn_count') {
        turnCountResults[evaluator.id] = session.turn_count_garden >= (evaluator.threshold || 0);
      } else {
        semanticEvaluators.push(evaluator);
      }
    }

    // If no semantic evaluators, return turn count results only
    if (semanticEvaluators.length === 0) {
      return {
        evaluator_results: turnCountResults,
        extracted_info: [],
        npc_attitude_delta: {},
        narrative_flags: [],
      };
    }

    // Build evaluator prompt
    const evaluatorPrompt = this.buildEvaluatorPrompt(
      gardenId,
      semanticEvaluators,
      playerMessage,
      npcResponse,
      session.variables,
      recentHistorySummary
    );

    try {
      const result = await this.llmProvider.generateJSON<EvaluatorResult>({
        system: 'You are a narrative game state evaluator. Analyze the latest dialogue exchange and output ONLY valid JSON. Do not include any other text.',
        messages: [{ role: 'user', content: evaluatorPrompt }],
        maxTokens: 512,
      });

      // Merge turn count results
      return {
        ...result,
        evaluator_results: {
          ...result.evaluator_results,
          ...turnCountResults,
        },
      };
    } catch (error) {
      console.error('Evaluator LLM call failed:', error);
      // Return only turn count results on failure
      return {
        evaluator_results: turnCountResults,
        extracted_info: [],
        npc_attitude_delta: {},
        narrative_flags: [],
      };
    }
  }

  private buildEvaluatorPrompt(
    gardenId: string,
    evaluators: EvaluatorDefinition[],
    playerMessage: string,
    npcResponse: string,
    currentVars: Record<string, unknown>,
    recentHistorySummary: string
  ): string {
    const context = {
      garden_id: gardenId,
      evaluators: evaluators.map(e => ({
        id: e.id,
        description: e.description,
      })),
      current_vars: currentVars,
      latest_exchange: {
        player: playerMessage,
        npc: npcResponse,
      },
      recent_history_summary: recentHistorySummary,
    };

    return `Analyze this dialogue exchange and evaluate each condition. Return a JSON object with this exact structure:
{
  "evaluator_results": { <evaluator_id>: true/false for each evaluator },
  "extracted_info": [ "string descriptions of key info revealed" ],
  "npc_attitude_delta": { "<npc_name>": { "from": "<previous_attitude>", "to": "<new_attitude>" } },
  "narrative_flags": [ "flag_names from: emotional_breakthrough, intimidation_used, lie_told, truth_discovered, violent_action, act_of_kindness" ]
}

Context:
${JSON.stringify(context, null, 2)}

Be conservative: only mark evaluator_results as true if the description CLEARLY matches what happened in the exchange. False negatives are better than false positives.`;
  }
}
