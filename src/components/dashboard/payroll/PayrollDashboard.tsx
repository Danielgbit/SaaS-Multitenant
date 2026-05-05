'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  ChevronRight,
  Plus,
  Loader2,
  ChevronDown,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { PayrollPeriod, PayrollDashboardSummary } from '@/types/payroll'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    isDark,
  }
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function parsePeriod(period: string): { month: number; year: number; label: string } {
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
    draft: { bg: COLORS.warning + '20', color: COLORS.warning, icon: Clock, label: 'Borrador' },
    approved: { bg: COLORS.primary + '20', color: COLORS.primary, icon: CheckCircle, label: 'Aprobado' },
    paid: { bg: COLORS.success + '20', color: COLORS.success, icon: CheckCircle, label: 'Pagado' },
  }[status] || { bg: COLORS.textMuted + '20', color: COLORS.textMuted, icon: Clock, label: status }

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

interface PeriodCardProps {
  period: PayrollPeriod
  colors: ReturnType<typeof useColors>
  onExpand?: () => void
  expanded?: boolean
}

function PeriodCard({ period, colors, onExpand, expanded }: PeriodCardProps) {
  const { month, year, label } = parsePeriod(period.period)

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: colors.surfaceGlass,
        borderColor: colors.border,
      }}
    >
      <div className="p-5">
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
                style={{ color: colors.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
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

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1" style={{ color: colors.textMuted }}>Total Bruto</p>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {formatCurrencyCOP(period.total_gross_pay || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1" style={{ color: colors.textMuted }}>Deducciones</p>
            <p className="text-sm font-semibold" style={{ color: colors.warning }}>
              -{formatCurrencyCOP(period.total_deductions || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
            <p className="text-xs mb-1" style={{ color: colors.textMuted }}>Neto a Pagar</p>
            <p className="text-sm font-bold" style={{ color: colors.success }}>
              {formatCurrencyCOP(period.total_net_pay || 0)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/payroll/${period.id}`}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: colors.primary }}
          >
            Ver detalle
            <ChevronRight className="w-4 h-4" />
          </Link>
          {onExpand && (
            <button
              onClick={onExpand}
              className="flex items-center gap-1 text-sm"
              style={{ color: colors.textMuted }}
            >
              {expanded ? 'Ocultar' : 'Ver'} empleados
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
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

  return (
    <div className="space-y-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

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
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Payroll
              </h1>
            </div>
          </div>
          <Link
            href="/payroll/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/10 text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Plus className="w-4 h-4" />
            Crear Período
          </Link>
          </div>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Wallet className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Pendiente
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
            {formatCurrencyCOP(dashboardData.total_pending_net)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
              <CheckCircle className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Listos para Pagar
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {dashboardData.employees_ready_to_pay}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Users className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Empleados Pendientes
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {dashboardData.total_pending_employees}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Períodos Activos
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {dashboardData.pending_periods?.length || 0}
          </p>
        </div>
      </div>

      {/* Current Period */}
      {dashboardData.current_period && (
        <div>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Período Actual
          </h2>
          <PeriodCard
            period={dashboardData.current_period}
            colors={COLORS}
            expanded={expandedPeriod === dashboardData.current_period?.id}
            onExpand={() => setExpandedPeriod(
              expandedPeriod === dashboardData.current_period?.id ? null : dashboardData.current_period?.id ?? null
            )}
          />
        </div>
      )}

      {/* Pending Periods */}
      {dashboardData.pending_periods && dashboardData.pending_periods.length > 0 && (
        <div>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Períodos Pendientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.pending_periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                colors={COLORS}
                expanded={expandedPeriod === period.id}
                onExpand={() => setExpandedPeriod(expandedPeriod === period.id ? null : period.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Periods State */}
      {!dashboardData.current_period && dashboardData.pending_periods?.length === 0 && (
        <div
          className="text-center py-16 px-6 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
            borderStyle: 'dashed',
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
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
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
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Períodos Anteriores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.previous_periods.map((period) => (
              <PeriodCard key={period.id} period={period} colors={COLORS} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}