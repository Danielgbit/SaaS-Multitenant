import type { OperationalSignal } from '../types'
import type { StaffUtilizationSummary } from '@/types/analytics'
import { THRESHOLDS, PRIORITIES } from '../thresholds'

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

export function detectUnderutilizedStaff(staffUtil: StaffUtilizationSummary): OperationalSignal[] {
  return staffUtil.staff
    .filter(s => s.utilizationPercent > 0 && s.utilizationPercent <= THRESHOLDS.UNDERUTILIZATION_PERCENT)
    .map(s => {
      const freeMinutes = s.availableMinutes - s.bookedMinutes
      const isSevere = s.utilizationPercent < 25
      return {
        id: `underutilized-staff-${s.employee_id}`,
        detector: 'underutilized-staff' as const,
        severity: (isSevere ? 'warning' : 'info') as OperationalSignal['severity'],
        priority: isSevere ? PRIORITIES.UNDERUTIL_SEVERE : PRIORITIES.UNDERUTIL_WARNING,
        title: `${s.employee_name} tiene disponibilidad`,
        description: `${s.utilizationPercent}% ocupación — ${formatMinutes(freeMinutes)} libres`,
        actionLabel: 'Asignar cita',
        actionHref: `/booking?employee=${s.employee_id}`,
        targetType: 'staff' as const,
        targetId: s.employee_id,
        metric: {
          current: s.utilizationPercent,
          threshold: THRESHOLDS.UNDERUTILIZATION_PERCENT,
          unit: '%' as const,
        },
      }
    })
}