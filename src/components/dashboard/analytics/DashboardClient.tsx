'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  TrendingUp,
  XCircle
} from 'lucide-react'
import { getDashboardData } from '@/actions/analytics/getDashboardData'
import { StatsCard } from './StatsCard'
import { TrendChart } from './TrendChart'
import { TopServicesList } from './TopServicesList'
import { PeriodSelector } from './PeriodSelector'
import { UpcomingAppointments } from './UpcomingAppointments'
import { RecentActivity } from './RecentActivity'
import { EmployeePerformance } from './EmployeePerformance'
import { AlertsPanel } from './AlertsPanel'
import { PayrollSummaryWidget } from './PayrollSummaryWidget'
import { BusinessHealthWidget } from './BusinessHealthWidget'
import { QuickActionsWidget } from './QuickActionsWidget'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    success: '#16A34A',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceElevated: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    glass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    gradientFrom: isDark ? '#38BDF8' : '#0F4C5C',
    gradientTo: isDark ? '#0EA5E9' : '#0C3E4A',
    isDark,
  }
}

type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

interface DashboardClientProps {
  organizationId: string
  role?: string | null
  employeeName?: string | null
  organizationName?: string | null
}

export function DashboardClient({ organizationId, role, employeeName, organizationName }: DashboardClientProps) {
  const COLORS = useColors()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<{
    overview: {
      appointments: number
      appointmentsChange: number
      revenue: number
      revenueChange: number
      clients: number
      clientsChange: number
      completionRate: number
      completionRateChange: number
      avgTicket: number
    }
    trend: Array<{
      date: string
      label: string
      appointments: number
      completed: number
      revenue: number
    }>
    topServices: Array<{
      serviceId: string
      serviceName: string
      count: number
      percentage: number
      revenue: number
    }>
  } | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const result = await getDashboardData(organizationId, period)
    if (result.success && result.data) {
      setData(result.data)
    }
    setLoading(false)
  }, [organizationId, period])

  useEffect(() => {
    if (role !== 'empleado') {
      loadDashboard()
    }
  }, [role, loadDashboard])

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
      iconColor: '#F59E0B'
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
      {/* Welcome Header for Employee - Org Context */}
      {role === 'empleado' && organizationName && (
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 animate-in fade-in duration-500"
          style={{
            background: 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 50%, #062C38 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Bienvenido</p>
                <h1
                  className="text-2xl md:text-3xl font-bold text-white"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {organizationName}
                </h1>
                <p className="text-sm mt-1 text-white/90">
                  Hola {employeeName || 'empleado'}, estas son tus citas de hoy
                </p>
              </div>
            </div>
            <PeriodSelector value={period} onChange={setPeriod} isDark />
          </div>
        </div>
      )}

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

      {/* Quick View Widget - Today's Summary */}
      <BusinessHealthWidget organizationId={organizationId} />

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
          <RecentActivity organizationId={organizationId} />
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          <QuickActionsWidget />
          <UpcomingAppointments organizationId={organizationId} />
          <EmployeePerformance organizationId={organizationId} period={period} />
          <PayrollSummaryWidget organizationId={organizationId} />
          <AlertsPanel organizationId={organizationId} />
        </div>
      </div>

      {/* Bottom Section - Top Services */}
      <TopServicesList services={data?.topServices || []} loading={loading} />
    </div>
  )
}
