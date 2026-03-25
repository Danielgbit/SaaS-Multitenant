'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  TrendingUp,
  XCircle,
  Loader2
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
}

export function DashboardClient({ organizationId }: DashboardClientProps) {
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

  useEffect(() => {
    loadDashboard()
  }, [organizationId, period])

  const loadDashboard = async () => {
    setLoading(true)
    const result = await getDashboardData(organizationId, period)
    if (result.success && result.data) {
      setData(result.data)
    }
    setLoading(false)
  }

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

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
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
