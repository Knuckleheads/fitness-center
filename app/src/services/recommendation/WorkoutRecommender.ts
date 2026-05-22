import { ALL_RULES } from './rules';
import type { RecommendationContext, WorkoutRecommendation } from './types';

export * from './types';

export function getRecommendations(ctx: RecommendationContext): WorkoutRecommendation[] {
  const results: WorkoutRecommendation[] = [];
  const seen = new Set<string>();

  for (const rule of ALL_RULES) {
    const rec = rule.evaluate(ctx);
    if (rec && !seen.has(rec.id)) {
      seen.add(rec.id);
      results.push(rec);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
