import type { OperationalSignal } from '../types'
import type { TodayPulse } from '@/types/analytics'
import { THRESHOLDS, PRIORITIES } from '../thresholds'

export function detectPendingConfirmations(pulse: TodayPulse): OperationalSignal[] {
  const { pendingConfirmations } = pulse
  const expectedNoShows = Math.round(pendingConfirmations * THRESHOLDS.EXPECTED_NO_SHOW_RATE)

  if (pendingConfirmations < THRESHOLDS.PENDING_CONFIRMATIONS_COUNT) {
    return []
  }

  const isSevere = pendingConfirmations >= 15

  return [{
    id: 'pending-confirmations',
    detector: 'pending-confirmations' as const,
    severity: (isSevere ? 'critical' : 'warning') as OperationalSignal['severity'],
    priority: isSevere ? PRIORITIES.PENDING_SEVERE : PRIORITIES.PENDING_WARNING,
    title: `${pendingConfirmations} citas sin confirmar`,
    description: `Riesgo estimado: ${expectedNoShows} no-shows`,
    actionLabel: 'Recordar ahora',
    actionHref: '/confirmations',
    targetType: 'org' as const,
    targetId: 'current',
    metric: {
      current: pendingConfirmations,
      threshold: THRESHOLDS.PENDING_CONFIRMATIONS_COUNT,
      unit: 'count' as const,
    },
  }]
}