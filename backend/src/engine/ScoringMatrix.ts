import { ScoringDimension } from '../../../shared/types/session.js';
import { ScoringSchema } from '../../../shared/types/story.js';

export class ScoringMatrix {
  /**
   * Initialize the scoring matrix from the story schema.
   */
  static initialize(schema: Record<string, ScoringSchema>): Record<string, ScoringDimension> {
    const matrix: Record<string, ScoringDimension> = {};
    for (const [key, def] of Object.entries(schema)) {
      matrix[key] = {
        value: def.default,
        range: def.range,
      };
    }
    return matrix;
  }

  /**
   * Apply narrative flag effects to the scoring matrix.
   */
  static applyFlags(
    matrix: Record<string, ScoringDimension>,
    flags: string[],
    flagEffects: Record<string, Record<string, number>>
  ): Record<string, ScoringDimension> {
    const updated = { ...matrix };

    for (const flag of flags) {
      const effects = flagEffects[flag];
      if (!effects) continue;

      for (const [dimension, delta] of Object.entries(effects)) {
        if (updated[dimension]) {
          const dim = { ...updated[dimension] };
          dim.value = Math.max(
            dim.range[0],
            Math.min(dim.range[1], dim.value + delta)
          );
          updated[dimension] = dim;
        }
      }
    }

    return updated;
  }

  /**
   * Apply direct score increments.
   */
  static applyIncrements(
    matrix: Record<string, ScoringDimension>,
    increments: Record<string, number>
  ): Record<string, ScoringDimension> {
    const updated = { ...matrix };

    for (const [dimension, delta] of Object.entries(increments)) {
      if (updated[dimension]) {
        const dim = { ...updated[dimension] };
        dim.value = Math.max(
          dim.range[0],
          Math.min(dim.range[1], dim.value + delta)
        );
        updated[dimension] = dim;
      }
    }

    return updated;
  }
}
