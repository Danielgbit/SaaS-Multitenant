'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Wallet, Users, TrendingUp, CheckCircle, Calendar, DollarSign, ChevronRight,
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CurrentPeriodCard } from './CurrentPeriodCard'
import { CompactPeriodCard } from './CompactPeriodCard'
import type { PayrollDashboardSummary } from '@/types/payroll'

interface PayrollDashboardProps {
  dashboardData: PayrollDashboardSummary
  error?: string | null
}

export function PayrollDashboard({ dashboardData, error }: PayrollDashboardProps) {
  const colors = useThemeColors()
  const router = useRouter()
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)

  const hasPending = dashboardData.pending_periods && dashboardData.pending_periods.length > 0
  const hasPrevious = dashboardData.previous_periods && dashboardData.previous_periods.length > 0
  const hasAnyPeriod = !!dashboardData.current_period || hasPending || hasPrevious

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {error && (
        <div
          className="p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: colors.error + '10', borderColor: colors.error + '30' }}
          role="alert"
        >
          <span className="text-sm font-medium" style={{ color: colors.error }}>
            Error al cargar la nómina: {error}
          </span>
        </div>
      )}

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: colors.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Crear Período
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Pendiente por pagar"
          value={formatCurrencyCOP(dashboardData.total_pending_net)}
          icon={<Wallet className="w-4 h-4" />}
          iconColor={colors.warning}
          onClick={hasPending ? () => router.push(`/payroll/period/${dashboardData.pending_periods![0].id}`) : undefined}
          footer={hasPending && <span className="text-xs" style={{ color: colors.textMuted }}>Revisar →</span>}
        />
        <MetricCard
          title="Listos para pagar"
          value={dashboardData.employees_ready_to_pay}
          suffix="empleados"
          icon={<CheckCircle className="w-4 h-4" />}
          iconColor={colors.success}
          onClick={dashboardData.employees_ready_to_pay > 0 && dashboardData.current_period ? () => router.push(`/payroll/period/${dashboardData.current_period!.id}`) : undefined}
          footer={dashboardData.employees_ready_to_pay > 0 && dashboardData.current_period && <span className="text-xs" style={{ color: colors.textMuted }}>Pagar →</span>}
        />
        <MetricCard
          title="Empleados en nómina"
          value={dashboardData.total_pending_employees}
          suffix="pendientes"
          icon={<Users className="w-4 h-4" />}
          iconColor={colors.primary}
        />
        <MetricCard
          title="Períodos activos"
          value={dashboardData.pending_periods?.length || 0}
          suffix="abiertos"
          icon={<TrendingUp className="w-4 h-4" />}
          iconColor={colors.success}
          onClick={() => router.push('/payroll/new')}
          footer={<span className="text-xs" style={{ color: colors.textMuted }}>Crear →</span>}
        />
      </div>

      {/* No periods empty state */}
      {!hasAnyPeriod && !error && (
        <Card variant="bordered" className="p-8">
          <EmptyState
            icon={<Calendar className="w-10 h-10" style={{ color: colors.primary }} />}
            title="Sin períodos de nómina"
            description="Crea tu primer período de nómina para comenzar a gestionar los pagos de tus empleados."
            action={
              <Link
                href="/payroll/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Crear Primer Período
              </Link>
            }
          />
        </Card>
      )}

      {/* Current Period */}
      {dashboardData.current_period && (
        <section aria-label="Período actual">
          <div className="flex items-center gap-2 mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: colors.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
            >
              Período Actual
            </h2>
            {dashboardData.total_employee_debt > 0 && (
              <span
                className="sm:hidden inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors.warning + '15', color: colors.warning }}
              >
                <DollarSign className="w-3 h-3" aria-hidden="true" />
                Deuda: {formatCurrencyCOP(dashboardData.total_employee_debt)}
              </span>
            )}
          </div>
          <CurrentPeriodCard
            period={dashboardData.current_period}
            expanded={expandedPeriod === dashboardData.current_period.id}
            onExpand={() => setExpandedPeriod(
              expandedPeriod === dashboardData.current_period!.id ? null : dashboardData.current_period!.id
            )}
            totalEmployeeDebt={dashboardData.total_employee_debt || 0}
          />
        </section>
      )}

      {/* Pending Periods */}
      {hasPending && (
        <section aria-label="Períodos pendientes">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: colors.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            Períodos Pendientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.pending_periods.map((period) => (
              <CompactPeriodCard
                key={period.id}
                period={period}
                isPending={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Previous Periods */}
      {hasPrevious && (
        <section aria-label="Períodos anteriores">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: colors.textPrimary, fontFamily: 'var(--font-cormorant-garamond)' }}
            >
              Períodos Anteriores
            </h2>
            <Link
              href="/payroll/history"
              className="text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
              style={{ color: colors.primary }}
            >
              Ver todos
              <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.previous_periods.map((period) => (
              <CompactPeriodCard
                key={period.id}
                period={period}
                isPending={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
