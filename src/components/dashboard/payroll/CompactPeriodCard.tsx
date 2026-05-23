'use client'

import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { StatusBadge } from './StatusBadge'
import type { PayrollPeriodWithEmployees } from '@/types/payroll'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parsePeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  return {
    month, year,
    label: `${MONTHS_ES[month - 1]} ${year}`,
  }
}

function getPeriodDateRange(period: string) {
  const [year, month] = period.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  const fmt = (d: Date) => d.getDate().toString()
  return `${fmt(startDate)} – ${fmt(endDate)} ${MONTHS_ES[month - 1].slice(0, 3)}`
}

interface CompactPeriodCardProps {
  period: PayrollPeriodWithEmployees
  isPending: boolean
}

export function CompactPeriodCard({ period, isPending }: CompactPeriodCardProps) {
  const colors = useThemeColors()
  const { label } = parsePeriod(period.period)
  const dateRange = getPeriodDateRange(period.period)

  return (
    <Link
      href={`/payroll/period/${period.id}`}
      className="block rounded-2xl border p-5 transition-all duration-200 hover:shadow-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: colors.surfaceGlass,
        borderColor: colors.border,
      }}
      aria-label={`Período ${label}, ${period.total_employees || 0} empleados`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.primary + '15' }}
            aria-hidden="true"
          >
            <Calendar className="w-4.5 h-4.5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3
              className="text-sm font-semibold font-heading"
              style={{ color: colors.textPrimary }}
            >
              {label}
            </h3>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {period.total_employees || 0} empleados · {dateRange}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold"
            style={{ color: colors.success }}
          >
            {formatCurrencyCOP(period.total_net_pay || 0)}
          </span>
          <ChevronRight
            className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            style={{ color: colors.textMuted }}
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={period.status} />
          {isPending && period.total_deductions > 0 && (
            <span className="text-xs" style={{ color: colors.textMuted }}>
              -{formatCurrencyCOP(period.total_deductions)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
