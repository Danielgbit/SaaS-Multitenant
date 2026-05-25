'use client'

import Link from 'next/link'
import { Users, AlertTriangle, ArrowRight } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { StaffUtilizationSummary as StaffUtilizationSummaryType } from '@/types/analytics'

interface StaffUtilizationProps {
  data: StaffUtilizationSummaryType
}

export function StaffUtilization({ data }: StaffUtilizationProps) {
  const COLORS = useThemeColors()

  const getUtilizationColor = (percent: number) => {
    if (percent > 90) return COLORS.error
    if (percent < 40) return COLORS.warning
    return COLORS.success
  }

  const overallColor = getUtilizationColor(data.overallUtilization)

  return (
    <Card variant="surface" className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: COLORS.primarySubtle }}
          >
            <Users className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>
            Ocupación del equipo
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {data.staff.map((employee) => {
          const barColor = getUtilizationColor(employee.utilizationPercent)
          const isActive = employee.bookedMinutes > 0 || employee.utilizationPercent > 0

          return (
            <div key={employee.employee_id} className="flex items-center gap-3">
              <span
                className="text-sm font-medium w-20 truncate"
                style={{ color: COLORS.textPrimary }}
                title={employee.employee_name}
              >
                {employee.employee_name}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, employee.utilizationPercent)}%`,
                    backgroundColor: isActive ? barColor : COLORS.textMuted,
                  }}
                />
              </div>
              <span
                className="text-sm font-medium w-12 text-right"
                style={{ color: isActive ? barColor : COLORS.textMuted }}
              >
                {isActive ? `${employee.utilizationPercent}%` : '-'}
              </span>
            </div>
          )
        })}
      </div>

      {(data.underutilizedCount > 0 || data.overloadedCount > 0) && (
        <div
          className="w-full h-px mb-4"
          style={{ backgroundColor: COLORS.border }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            Ocupación general:{' '}
            <span className="font-semibold" style={{ color: overallColor }}>
              {data.overallUtilization}%
            </span>
          </p>
          {data.underutilizedCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" style={{ color: COLORS.warning }} />
              <span className="text-xs" style={{ color: COLORS.warning }}>
                {data.underutilizedCount} empleado{data.underutilizedCount > 1 ? 's' : ''} subutilizado{data.underutilizedCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {data.overloadedCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" style={{ color: COLORS.error }} />
              <span className="text-xs" style={{ color: COLORS.error }}>
                {data.overloadedCount} sobrecargado{data.overloadedCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}