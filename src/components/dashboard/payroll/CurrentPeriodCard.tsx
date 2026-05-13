'use client'

import Link from 'next/link'
import { Calendar, ChevronDown, ChevronRight, DollarSign, Calculator } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { StatusBadge } from './StatusBadge'
import { EmployeeRow } from './EmployeeRow'
import { ProgressStepTooltip } from './ProgressStepTooltip'
import { PAYROLL_STATUS_CONFIG } from '@/lib/payroll/constants'
import type { PayrollPeriodWithEmployees, PeriodStatus } from '@/types/payroll'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parsePeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  return { month, year, label: `${MONTHS_ES[month - 1]} ${year}` }
}

function getPeriodDateRange(period: string) {
  const [year, month] = period.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = startDate.toLocaleDateString('es-CO', opts)
  const end = endDate.toLocaleDateString('es-CO', opts)
  return `${start} – ${end}`
}

const PROGRESS_STEPS = Object.entries(PAYROLL_STATUS_CONFIG).map(([key, config]) => ({
  key: key as PeriodStatus,
  label: config.label,
  description: config.shortDesc,
  tooltip: config.tooltip,
}))

interface CurrentPeriodCardProps {
  period: PayrollPeriodWithEmployees
  expanded: boolean
  onExpand?: () => void
  totalEmployeeDebt: number
}

export function CurrentPeriodCard({
  period, expanded, onExpand, totalEmployeeDebt,
}: CurrentPeriodCardProps) {
  const colors = useThemeColors()
  const { label } = parsePeriod(period.period)
  const dateRange = getPeriodDateRange(period.period)
  const hasEmployees = period.employees && period.employees.length > 0
  const currentStep = PROGRESS_STEPS.findIndex((s) => s.key === period.status)

  const mainAction = period.status === 'draft'
    ? { href: `/payroll/period/${period.id}`, label: 'Calcular nómina', icon: Calculator }
    : { href: `/payroll/period/${period.id}`, label: 'Revisar y aprobar', icon: ChevronRight }
  const ActionIcon = mainAction.icon

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{ borderColor: colors.primary, backgroundColor: colors.surface }}
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.primary + '15' }}
              aria-hidden="true"
            >
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: colors.primary }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: colors.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
                >
                  {label}
                </h2>
                <StatusBadge status={period.status} showPulse={period.status !== 'draft'} />
              </div>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {period.total_employees || 0} empleados · {dateRange}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:shrink-0">
            {totalEmployeeDebt > 0 && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: colors.warning + '15', color: colors.warning }}
              >
                <DollarSign className="w-3 h-3" aria-hidden="true" />
                Deuda: {formatCurrencyCOP(totalEmployeeDebt)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-0 mb-5 px-2" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={3} aria-label="Progreso del período">
          {PROGRESS_STEPS.map((step, idx) => {
            const isActive = idx <= currentStep
            const isCurrent = idx === currentStep
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300"
                      style={{
                        backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
                        color: isActive ? '#fff' : colors.textMuted,
                        border: isCurrent ? `2px solid ${colors.primary}` : '2px solid transparent',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <ProgressStepTooltip
                      whenUsed={step.tooltip.whenUsed}
                      restrictions={step.tooltip.restrictions}
                    />
                  </div>
                  <span
                    className="text-[10px] sm:text-xs font-medium text-center leading-tight"
                    style={{ color: isActive ? colors.textPrimary : colors.textMuted }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-[9px] sm:text-[10px] font-medium text-center leading-tight -mt-1"
                    style={{
                      color: isCurrent
                        ? colors.textSecondary
                        : isActive
                          ? colors.textMuted
                          : colors.textMuted,
                      opacity: isActive ? 1 : 0.55,
                    }}
                  >
                    {step.description}
                  </span>
                </div>
                {idx < PROGRESS_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-1 sm:mx-2 rounded-full mb-10 sm:mb-12"
                    style={{ backgroundColor: idx < currentStep ? colors.primary : colors.border }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <div className="text-center p-3.5 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1 font-medium" style={{ color: colors.textMuted }}>
              Total Bruto
            </p>
            <p className="text-sm sm:text-base font-semibold" style={{ color: colors.textPrimary }}>
              {formatCurrencyCOP(period.total_gross_pay || 0)}
            </p>
          </div>
          <div className="text-center p-3.5 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1 font-medium" style={{ color: colors.textMuted }}>
              Deducciones
            </p>
            <p className="text-sm sm:text-base font-semibold" style={{ color: colors.warning }}>
              -{formatCurrencyCOP(period.total_deductions || 0)}
            </p>
          </div>
          <div className="text-center p-3.5 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1 font-medium" style={{ color: colors.textMuted }}>
              Neto a Pagar
            </p>
            <p className="text-base sm:text-lg font-bold" style={{ color: colors.success }}>
              {formatCurrencyCOP(period.total_net_pay || 0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href={mainAction.href}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 w-full sm:w-auto"
            style={{ backgroundColor: colors.primary }}
          >
            <ActionIcon className="w-4 h-4" />
            {mainAction.label}
          </Link>
          {onExpand && (
            <button
              onClick={onExpand}
              className="flex items-center justify-center gap-1.5 text-sm transition-all duration-200 hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg px-2 py-1 w-full sm:w-auto"
              style={{ color: colors.textMuted }}
              aria-expanded={expanded}
              aria-controls="employee-list"
            >
              {expanded ? 'Ocultar' : 'Ver'} empleados
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Expanded employee list */}
        {expanded && (
          <div id="employee-list" className="mt-5 pt-5 border-t" style={{ borderColor: colors.border }}>
            {hasEmployees ? (
              <>
                <div className="space-y-2">
                  {period.employees.map((emp) => (
                    <EmployeeRow key={emp.id} employee={emp} compact={false} />
                  ))}
                </div>
                <Link
                  href={`/payroll/period/${period.id}`}
                  className="flex items-center justify-center gap-1.5 mt-3 text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
                  style={{ color: colors.primary }}
                >
                  Ver detalle completo del período
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: colors.primary + '10' }}
                  aria-hidden="true"
                >
                  <Calendar className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  Sin empleados en este período
                </p>
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Agrega empleados desde el detalle del período para calcular la nómina.
                </p>
                <Link
                  href={`/payroll/period/${period.id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
                  style={{ color: colors.primary }}
                >
                  Agregar empleados
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
