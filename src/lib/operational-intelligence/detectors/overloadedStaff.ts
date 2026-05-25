import type { OperationalSignal } from '../types'
import type { StaffUtilizationSummary } from '@/types/analytics'
import { THRESHOLDS, PRIORITIES } from '../thresholds'

export function detectOverloadedStaff(staffUtil: StaffUtilizationSummary): OperationalSignal[] {
  return staffUtil.staff
    .filter(s => s.utilizationPercent >= THRESHOLDS.OVERLOAD_PERCENT)
    .map(s => {
      const isCritical = s.utilizationPercent >= 95
      return {
        id: `overloaded-staff-${s.employee_id}`,
        detector: 'overloaded-staff' as const,
        severity: (isCritical ? 'critical' : 'warning') as OperationalSignal['severity'],
        priority: isCritical ? PRIORITIES.OVERLOAD_CRITICAL : PRIORITIES.OVERLOAD_WARNING,
        title: `${s.employee_name} está sobrecargado`,
        description: `${s.utilizationPercent}% de ocupación — posible saturación`,
        actionLabel: 'Ver agenda',
        actionHref: `/calendar?employee=${s.employee_id}`,
        targetType: 'staff' as const,
        targetId: s.employee_id,
        metric: {
          current: s.utilizationPercent,
          threshold: THRESHOLDS.OVERLOAD_PERCENT,
          unit: '%' as const,
        },
      }
    })
}