'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation'
import { flags } from '@/lib/flags'
import { ChartErrorBoundary, ChartSkeleton } from '@/components/ui/ChartErrorBoundary'
import { InsightsBanner } from './InsightsBanner'
import { PeriodSelector } from './PeriodSelector'
import {
  OverviewStatsGrid,
  TrendChartSection,
  UpcomingSection,
  AlertsSection,
  TopServicesSection,
  TodayPulseSection,
  StaffUtilizationSection,
} from './DashboardSections'
import type { Period } from '@/types/analytics'

interface DashboardClientProps {
  organizationId: string
  role?: string | null
  employeeName?: string | null
  organizationName?: string | null
}

export function DashboardClient({ organizationId, role, employeeName }: DashboardClientProps) {
  const COLORS = useThemeColors()
  const [period, setPeriod] = useState<Period>('month')

  useRealtimeInvalidation(organizationId)

  if (role === 'empleado') {
    return (
      <div className="space-y-6">
        <div 
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.gradientFrom} 0%, ${COLORS.gradientTo} 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Bienvenido</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                  Hola, {employeeName || 'Empleado'}
                </h1>
                <p className="text-sm mt-1 text-white/80">
                  Tu resumen de actividad
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/calendar" className="group block p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8] transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
                <Calendar className="w-6 h-6" style={{ color: COLORS.primary }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mi Agenda</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ver mis citas</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium transition-all" style={{ color: COLORS.primary }}>
              <span className="group-hover:gap-2 transition-all">Ir a Agenda</span>
              <TrendingUp className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/confirmations" className="group block p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8] transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.warningLight }}>
                <CheckCircle2 className="w-6 h-6" style={{ color: COLORS.warning }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Confirmaciones</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pendientes de confirmar</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium transition-all" style={{ color: COLORS.primary }}>
              <span className="group-hover:gap-2 transition-all">Ver confirmaciones</span>
              <TrendingUp className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/payroll/mi" className="group block p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8] transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
                <DollarSign className="w-6 h-6" style={{ color: COLORS.success }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mi Nómina</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ver mis ingresos</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium transition-all" style={{ color: COLORS.primary }}>
              <span className="group-hover:gap-2 transition-all">Ver nómina</span>
              <TrendingUp className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient - Admin/Owner/Staff */}
      <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{
            background: `linear-gradient(135deg, ${COLORS.gradientFrom} 0%, ${COLORS.gradientTo} 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Panel de Control</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm mt-1 text-white/80">
                  Resumen de tu negocio
                </p>
              </div>
            </div>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>

      <InsightsBanner orgId={organizationId} period={period} />

      {/* KPI Cards Grid */}
      <OverviewStatsGrid orgId={organizationId} period={period} />

      {/* Main Content Grid - 2 columns on tablet, 2 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* Left Column - TodayPulse + Chart */}
        <div className="space-y-6">
          <TodayPulseSection orgId={organizationId} />
          <ChartErrorBoundary chartName="Evolución de Citas" fallback={<ChartSkeleton />}>
            <TrendChartSection orgId={organizationId} period={period} />
          </ChartErrorBoundary>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          <UpcomingSection orgId={organizationId} />
          <StaffUtilizationSection orgId={organizationId} />
          <AlertsSection orgId={organizationId} />
        </div>
      </div>

      {/* Bottom Section - Top Services */}
      <TopServicesSection orgId={organizationId} period={period} />
    </div>
  )
}
