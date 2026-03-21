'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  Loader2,
  Scissors,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import { getDashboardData } from '@/actions/analytics/getDashboardData'
import { StatsCard } from './StatsCard'
import { TrendChart } from './TrendChart'
import { TopServicesList } from './TopServicesList'
import { PeriodSelector } from './PeriodSelector'

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

  const statsCards = [
    {
      title: 'Citas',
      value: data?.overview.appointments || 0,
      change: data?.overview.appointmentsChange,
      icon: <Calendar className="w-4 h-4" />,
      color: COLORS.primary
    },
    {
      title: 'Ingresos',
      value: data?.overview.revenue || 0,
      prefix: '€',
      change: data?.overview.revenueChange,
      icon: <DollarSign className="w-4 h-4" />,
      color: '#10B981'
    },
    {
      title: 'Clientes',
      value: data?.overview.clients || 0,
      change: data?.overview.clientsChange,
      icon: <Users className="w-4 h-4" />,
      color: '#8B5CF6'
    },
    {
      title: 'Tasa Completado',
      value: data?.overview.completionRate || 0,
      suffix: '%',
      change: data?.overview.completionRateChange,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: '#F59E0B'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.gradientFrom} 0%, ${COLORS.gradientTo} 100%)`,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 
                className="text-3xl font-semibold text-white"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Analytics
              </h1>
              <p 
                className="text-sm mt-1 text-white/80"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Analiza el rendimiento de tu negocio
              </p>
            </div>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} isDark />
        </div>
      </div>

      {/* Stats Cards with glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            prefix={stat.prefix}
            suffix={stat.suffix}
            icon={stat.icon}
            iconColor={stat.color}
            loading={loading}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={data?.trend || []} loading={loading} />
        </div>
        <div>
          <TopServicesList services={data?.topServices || []} loading={loading} />
        </div>
      </div>

      {/* Quick Stats with glassmorphism */}
      <div 
        className="p-6 rounded-2xl border backdrop-blur-sm"
        style={{ 
          backgroundColor: COLORS.glass, 
          borderColor: COLORS.border,
          boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
            <Sparkles className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Resumen Rápido
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <p 
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Ticket promedio
            </p>
            <p 
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              €{data?.overview.avgTicket || 0}
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <p 
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Ingresos del período
            </p>
            <p 
              className="text-2xl font-bold"
              style={{ color: COLORS.success, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              €{data?.overview.revenue || 0}
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <p 
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Citas completadas
            </p>
            <p 
              className="text-2xl font-bold"
              style={{ color: COLORS.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {Math.round((data?.overview.completionRate || 0) * (data?.overview.appointments || 0) / 100)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
