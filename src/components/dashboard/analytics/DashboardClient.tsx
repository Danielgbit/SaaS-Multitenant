'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle2, DollarSign, Users, TrendingUp, XCircle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PeriodSelector } from './PeriodSelector'
import { StatsCard } from './StatsCard'
import { TrendChart } from './TrendChart'
import { RecentActivity } from './RecentActivity'
import { UpcomingAppointments } from './UpcomingAppointments'
import { EmployeePerformance } from './EmployeePerformance'
import { PayrollSummaryWidget } from './PayrollSummaryWidget'
import { AlertsPanel } from './AlertsPanel'
import { TopServicesList } from './TopServicesList'

type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

interface DashboardClientProps {
  organizationId: string
  role?: string | null
  employeeName?: string | null
  organizationName?: string | null
}

export function DashboardClient({ organizationId, role, employeeName, organizationName }: DashboardClientProps) {
  const COLORS = useThemeColors()
  const [period, setPeriod] = useState<Period>('month')
  const { loading, data } = useAnalytics({ organizationId, period })

  const totalAppointments = data?.overview.appointments || 0
  const completedAppointments = data?.overview.completionRate && totalAppointments
    ? Math.round((data.overview.completionRate / 100) * totalAppointments)
    : 0
  const cancellationRate = totalAppointments > 0
    ? Math.round(((totalAppointments - completedAppointments) / totalAppointments) * 100)
    : 0

  const statsCards = [
    {
      title: 'Citas',
      value: data?.overview.appointments || 0,
      change: data?.overview.appointmentsChange,
      icon: <Calendar className="w-4 h-4" />,
      iconColor: COLORS.primary
    },
    {
      title: 'Ingresos',
      value: data?.overview.revenue || 0,
      prefix: 'COP ',
      change: data?.overview.revenueChange,
      icon: <DollarSign className="w-4 h-4" />,
      iconColor: '#10B981'
    },
    {
      title: 'Nuevos Clientes',
      value: data?.overview.clients || 0,
      change: data?.overview.clientsChange,
      icon: <Users className="w-4 h-4" />,
      iconColor: '#8B5CF6'
    },
    {
      title: 'Ticket Promedio',
      value: data?.overview.avgTicket || 0,
      prefix: 'COP ',
      change: data?.overview.appointmentsChange,
      icon: <TrendingUp className="w-4 h-4" />,
      iconColor: COLORS.warning
    },
    {
      title: 'Finalizadas',
      value: data?.overview.completionRate || 0,
      suffix: '%',
      change: data?.overview.completionRateChange,
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: '#10B981'
    },
    {
      title: 'Canceladas',
      value: cancellationRate || 0,
      suffix: '%',
      change: undefined,
      icon: <XCircle className="w-4 h-4" />,
      iconColor: '#EF4444'
    }
  ]

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
                <h1 
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
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
              <div className="w-12 h-12 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#0F4C5C] dark:text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mi Agenda</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ver mis citas</p>
              </div>
            </div>
            <div className="flex items-center text-[#0F4C5C] dark:text-[#38BDF8] text-sm font-medium group-hover:gap-2 transition-all">
              Ir a Agenda
              <TrendingUp className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/confirmations" className="group block p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8] transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Confirmaciones</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pendientes de confirmar</p>
              </div>
            </div>
            <div className="flex items-center text-[#0F4C5C] dark:text-[#38BDF8] text-sm font-medium group-hover:gap-2 transition-all">
              Ver confirmaciones
              <TrendingUp className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/payroll/mi" className="group block p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8] transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mi Nómina</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ver mis ingresos</p>
              </div>
            </div>
            <div className="flex items-center text-[#0F4C5C] dark:text-[#38BDF8] text-sm font-medium group-hover:gap-2 transition-all">
              Ver nómina
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
      {role !== 'empleado' && (
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
                <h1
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm mt-1 text-white/80">
                  Resumen de tu negocio
                </p>
              </div>
            </div>
            <PeriodSelector value={period} onChange={setPeriod} isDark />
          </div>
        </div>
      )}

      {/* KPI Cards Grid - 6 cards in 3x2 on tablet, 6x1 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            prefix={stat.prefix}
            suffix={stat.suffix}
            icon={stat.icon}
            iconColor={stat.iconColor}
            loading={loading}
            delay={index * 50}
          />
        ))}
      </div>

      {/* Main Content Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Chart + Activity */}
        <div className="space-y-6">
          <TrendChart data={data?.trend || []} loading={loading} />
          <RecentActivity activities={data?.recentActivity || []} loading={loading} />
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          <UpcomingAppointments appointments={data?.upcomingAppointments || []} loading={loading} />
          <EmployeePerformance employees={data?.employeePerformance || []} loading={loading} />
          <PayrollSummaryWidget summary={data?.payrollSummary} loading={loading} />
          <AlertsPanel alerts={data?.alerts || []} loading={loading} />
        </div>
      </div>

      {/* Bottom Section - Top Services */}
      <TopServicesList services={data?.topServices || []} loading={loading} />
    </div>
  )
}
