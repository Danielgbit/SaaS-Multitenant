'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Plus,
  ChevronDown,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { PayrollPeriodWithEmployees, PeriodEmployeeSummary } from '@/types/payroll'

function useColors() {
  return useThemeColors()
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parsePeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  return {
    month,
    year,
    label: `${MONTHS_ES[month - 1]} ${year}`,
  }
}

function StatusBadge({ status }: { status: string }) {
  const COLORS = useColors()
  const config = {
    draft: {
      bg: COLORS.warning + '20',
      color: COLORS.warning,
      icon: Clock,
      label: 'Borrador',
      pulse: false,
    },
    approved: {
      bg: COLORS.primary + '20',
      color: COLORS.primary,
      icon: CheckCircle,
      label: 'Aprobado',
      pulse: false,
    },
    paid: {
      bg: COLORS.success + '20',
      color: COLORS.success,
      icon: CheckCircle,
      label: 'Pagado',
      pulse: false,
    },
  }[status] || {
    bg: COLORS.textMuted + '20',
    color: COLORS.textMuted,
    icon: Clock,
    label: status,
    pulse: false,
  }

  const Icon = config.icon

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

function EmployeeRow({
  employee,
  colors,
  compact,
}: {
  employee: PeriodEmployeeSummary
  colors: ReturnType<typeof useColors>
  compact: boolean
}) {
  const initial = employee.name.charAt(0).toUpperCase()

  const contractLabel = employee.contract_type === 'laboral' ? 'Laboral' : 'Prestación'
  const contractColor = employee.contract_type === 'laboral' ? colors.primary : colors.success

  let payLabel = ''
  let payColor = colors.textMuted
  if (employee.payment_type === 'porcentaje') {
    payLabel = `${employee.commission_rate}%`
    payColor = colors.warning
  } else if (employee.payment_type === 'fijo') {
    payLabel = 'Fijo'
    payColor = colors.primary
  } else if (employee.payment_type === 'mixed') {
    payLabel = `Mixto · ${employee.commission_rate}%`
    payColor = colors.primary
  }

  return (
    <Link
      href={`/payroll/${employee.id}`}
      className="flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
      style={{ backgroundColor: colors.surfaceSubtle }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.border)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.surfaceSubtle)}
    >
      <div className="flex items-center gap-2.5 min-w-0 min-h-[44px]">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ backgroundColor: colors.primary }}
        >
          {initial}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
            {employee.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: contractColor + '20', color: contractColor }}
            >
              {contractLabel}
            </span>
            {payLabel && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={{ backgroundColor: payColor + '20', color: payColor }}
              >
                {payLabel}
              </span>
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

interface PeriodCardProps {
  period: PayrollPeriodWithEmployees
  colors: ReturnType<typeof useColors>
  onExpand?: () => void
  expanded?: boolean
  variant?: 'current' | 'pending' | 'previous'
}

function PeriodCard({ period, colors, onExpand, expanded, variant = 'pending' }: PeriodCardProps) {
  const { label } = parsePeriod(period.period)
  const isPaid = period.status === 'paid'
  const hasEmployees = period.employees && period.employees.length > 0

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: colors.surfaceGlass,
        borderColor: variant === 'current' ? colors.primary : colors.border,
        borderWidth: variant === 'current' ? 2 : 1,
        opacity: isPaid ? 0.75 : 1,
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Calendar className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: colors.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
              >
                {label}
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {period.total_employees || 0} empleados
              </p>
            </div>
          </div>
          <StatusBadge status={period.status} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1" style={{ color: colors.textMuted }}>
              Total Bruto
            </p>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {formatCurrencyCOP(period.total_gross_pay || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1" style={{ color: colors.textMuted }}>
              Deducciones
            </p>
            <p className="text-sm font-semibold" style={{ color: colors.warning }}>
              -{formatCurrencyCOP(period.total_deductions || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1" style={{ color: colors.textMuted }}>
              Neto a Pagar
            </p>
            <p className="text-sm font-bold" style={{ color: colors.success }}>
              {formatCurrencyCOP(period.total_net_pay || 0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/payroll/period/${period.id}`}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: colors.primary }}
          >
            Ver detalle
            <ChevronRight className="w-4 h-4" />
          </Link>
          {onExpand && !isPaid && hasEmployees && (
            <button
              onClick={onExpand}
              className="flex items-center gap-1 text-sm transition-colors hover:opacity-80 cursor-pointer"
              style={{ color: colors.textMuted }}
            >
              {expanded ? 'Ocultar' : 'Ver'} empleados
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Expanded employee list */}
        {expanded && hasEmployees && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
            <div className="space-y-2">
              {period.employees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  colors={colors}
                  compact={variant === 'previous'}
                />
              ))}
            </div>
            <Link
              href={`/payroll/period/${period.id}`}
              className="flex items-center justify-center gap-1.5 mt-3 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: colors.primary }}
            >
              Ver detalle completo
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

interface PayrollDashboardProps {
  dashboardData: PayrollDashboardSummary
}

export function PayrollDashboard({ dashboardData }: PayrollDashboardProps) {
  const COLORS = useColors()
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedPeriod(expandedPeriod === id ? null : id)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Nómina
              </p>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
              >
                Payroll
              </h1>
            </div>
          </div>
          <Link
            href="/payroll/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/10 text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Plus className="w-4 h-4" />
            Crear Período
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pendiente por pagar"
          value={formatCurrencyCOP(dashboardData.total_pending_net)}
          icon={DollarSign}
          color={COLORS.warning}
          bgColor={COLORS.warning + '15'}
          colors={COLORS}
        />
        <StatCard
          label="Listos para pagar"
          value={`${dashboardData.employees_ready_to_pay} empleados`}
          icon={CheckCircle}
          color={COLORS.success}
          bgColor={COLORS.success + '15'}
          colors={COLORS}
        />
        <StatCard
          label="Empleados en nómina"
          value={`${dashboardData.total_pending_employees} pendientes`}
          icon={Users}
          color={COLORS.primary}
          bgColor={COLORS.primary + '15'}
          colors={COLORS}
        />
        <StatCard
          label="Períodos activos"
          value={`${dashboardData.pending_periods?.length || 0} abiertos`}
          icon={TrendingUp}
          color={COLORS.success}
          bgColor={COLORS.success + '15'}
          colors={COLORS}
        />
      </div>

      {/* Current Period */}
      {dashboardData.current_period && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
            >
              Período Actual
            </h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
            >
              Activo
            </span>
          </div>
          <PeriodCard
            period={dashboardData.current_period}
            colors={COLORS}
            variant="current"
            expanded={expandedPeriod === dashboardData.current_period.id}
            onExpand={() => toggleExpand(dashboardData.current_period!.id)}
          />
        </div>
      )}

      {/* Pending Periods */}
      {dashboardData.pending_periods && dashboardData.pending_periods.length > 0 && (
        <div>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            Períodos Pendientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.pending_periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                colors={COLORS}
                variant="pending"
                expanded={expandedPeriod === period.id}
                onExpand={() => toggleExpand(period.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Periods State */}
      {!dashboardData.current_period && dashboardData.pending_periods?.length === 0 && (
        <div
          className="text-center py-16 px-6 rounded-2xl border border-dashed"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary + '10' }}
          >
            <Calendar className="w-8 h-8" style={{ color: COLORS.primary }} />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            Sin períodos de nómina
          </h3>
          <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
            Crea tu primer período de nómina para comenzar a gestionar los pagos de tus empleados.
          </p>
          <Link
            href="/payroll/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Plus className="w-4 h-4" />
            Crear Primer Período
          </Link>
        </div>
      )}

      {/* Previous Periods */}
      {dashboardData.previous_periods && dashboardData.previous_periods.length > 0 && (
        <div>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            Períodos Anteriores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.previous_periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                colors={COLORS}
                variant="previous"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  colors,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  bgColor: string
  colors: ReturnType<typeof useColors>
}) {
  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ backgroundColor: colors.surfaceGlass, borderColor: colors.border }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: bgColor }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
          {label}
        </span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
