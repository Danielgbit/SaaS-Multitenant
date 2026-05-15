'use client'

import Link from 'next/link'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Badge } from '@/components/ui/Badge'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { PeriodEmployeeSummary } from '@/types/payroll'

interface EmployeeRowProps {
  employee: PeriodEmployeeSummary
  compact?: boolean
}

export function EmployeeRow({ employee, compact = false }: EmployeeRowProps) {
  const colors = useThemeColors()
  const initial = employee.name.charAt(0).toUpperCase()
  const contractVariant = employee.contract_type === 'laboral' ? 'primary' : 'success'

  let payLabel = ''
  let payVariant: 'warning' | 'primary' | 'info' = 'primary'
  if (employee.payment_type === 'porcentaje') {
    payLabel = `${employee.commission_rate}%`
    payVariant = 'warning'
  } else if (employee.payment_type === 'fijo') {
    payLabel = 'Fijo'
    payVariant = 'primary'
  } else if (employee.payment_type === 'mixed') {
    payLabel = `Mixto · ${employee.commission_rate}%`
    payVariant = 'info'
  }

  return (
    <Link
      href={`/payroll/${employee.id}`}
      className="flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      style={{
        backgroundColor: colors.surfaceSubtle,
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 min-h-[44px]">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: colors.primary }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
            {employee.name}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant={contractVariant} size="sm">
              {employee.contract_type === 'laboral' ? 'Laboral' : 'Prestación'}
            </Badge>
            {payLabel && (
              <Badge variant={payVariant} size="sm">
                {payLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {formatCurrencyCOP(employee.net_pay)}
        </p>
        {!compact && (
          <p className="text-xs" style={{ color: colors.textMuted }}>
            {employee.services_count} servicios
          </p>
        )}
      </div>
    </Link>
  )
}
