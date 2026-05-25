import type { OperationalSignal } from './types'
import { THRESHOLDS } from './thresholds'

export function aggregateSignals(signals: OperationalSignal[]): OperationalSignal[] {
  const byDetector = new Map<string, OperationalSignal[]>()

  for (const signal of signals) {
    const group = byDetector.get(signal.detector) || []
    group.push(signal)
    byDetector.set(signal.detector, group)
  }

  const aggregated: OperationalSignal[] = []

  for (const [detector, group] of byDetector) {
    const sorted = group.sort((a, b) => b.priority - a.priority)

    if (sorted.length === 1) {
      aggregated.push(sorted[0])
      continue
    }

    const top = sorted[0]
    const children = sorted.map(s => s.id)

    aggregated.push({
      ...top,
      id: `${detector}-group`,
      isAggregated: true,
      count: sorted.length,
      children,
      title: `${sorted.length} empleados sobrecargados`,
    })
  }

  return aggregated
    .sort((a, b) => b.priority - a.priority)
    .slice(0, THRESHOLDS.MAX_BANNER_SIGNALS)
}