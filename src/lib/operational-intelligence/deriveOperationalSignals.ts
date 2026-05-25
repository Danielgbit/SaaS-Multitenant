import type { OperationalSignal, DerivedSignals } from './types'
import type { TodayPulse } from '@/types/analytics'
import type { StaffUtilizationSummary } from '@/types/analytics'
import { detectOverloadedStaff } from './detectors/overloadedStaff'
import { detectUnderutilizedStaff } from './detectors/underutilizedStaff'
import { detectPendingConfirmations } from './detectors/pendingConfirmations'
import { aggregateSignals } from './aggregate'

export function deriveOperationalSignals(
  pulse: TodayPulse | undefined,
  staffUtil: StaffUtilizationSummary | undefined
): DerivedSignals {
  const all: OperationalSignal[] = [
    ...(pulse ? detectPendingConfirmations(pulse) : []),
    ...(staffUtil ? detectOverloadedStaff(staffUtil) : []),
    ...(staffUtil ? detectUnderutilizedStaff(staffUtil) : []),
  ]

  const aggregated = aggregateSignals(all)

  const aggregatedIds = new Set(aggregated.flatMap(s => s.children || [s.id]))

  return {
    contextualSignals: all.filter(s => !aggregatedIds.has(s.id)),
    bannerSignals: aggregated,
  }
}