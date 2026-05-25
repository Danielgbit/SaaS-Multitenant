import { insightRules } from './rules'
import type { Insight, InsightContext } from './types'

export function evaluateInsights(ctx: InsightContext): Insight[] {
  const insights: Insight[] = []

  for (const rule of insightRules) {
    try {
      const result = rule.evaluate(ctx)
      if (result) {
        insights.push(result)
      }
    } catch (e) {
      console.error(`[insights] Error evaluating rule ${rule.id}:`, e)
    }
  }

  return insights
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5)
}
