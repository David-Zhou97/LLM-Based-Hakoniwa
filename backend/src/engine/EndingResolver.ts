import { EndingDefinition } from '../../../shared/types/story.js';
import { SessionState } from '../../../shared/types/session.js';
import { ConditionParser } from './ConditionParser.js';

export class EndingResolver {
  private conditionParser: ConditionParser;

  constructor() {
    this.conditionParser = new ConditionParser();
  }

  /**
   * Resolve which ending the player gets based on their final scoring matrix.
   * Returns the first matching ending by priority order.
   */
  resolve(endings: EndingDefinition[], session: SessionState): EndingDefinition | null {
    // Sort by priority (lower number = higher priority)
    const sorted = [...endings].sort((a, b) => a.priority - b.priority);

    for (const ending of sorted) {
      if (this.conditionParser.evaluate(ending.condition, session)) {
        return ending;
      }
    }

    return null;
  }

  /**
   * Check if the current garden is a terminal (ending) garden.
   */
  isTerminalGarden(gardenId: string, endings: EndingDefinition[]): boolean {
    return endings.some(e => e.garden === gardenId);
  }
}
