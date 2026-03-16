'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  Loader2,
  Scissors,
  TrendingUp
} from 'lucide-react'
import { getDashboardData } from '@/actions/analytics/getDashboardData'
import { StatsCard } from './StatsCard'
import { TrendChart } from './TrendChart'
import { TopServicesList } from './TopServicesList'
import { PeriodSelector } from './PeriodSelector'

const COLORS = {
  primary: '#0F4C5C',
  success: '#16A34A',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
}

type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

interface DashboardClientProps {
  organizationId: string
}

export function DashboardClient({ organizationId }: DashboardClientProps) {
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
      icon: <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
    },
    {
      title: 'Ingresos',
      value: data?.overview.revenue || 0,
      prefix: '€',
      change: data?.overview.revenueChange,
      icon: <DollarSign className="w-4 h-4" style={{ color: '#10B981' }} />
    },
    {
      title: 'Clientes',
      value: data?.overview.clients || 0,
      change: data?.overview.clientsChange,
      icon: <Users className="w-4 h-4" style={{ color: '#8B5CF6' }} />
    },
    {
      title: 'Tasa Completado',
      value: data?.overview.completionRate || 0,
      suffix: '%',
      change: data?.overview.completionRateChange,
      icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#F59E0B' }} />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Analytics
          </h1>
          <p 
            className="text-sm mt-1"
            style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Analiza el rendimiento de tu negocio
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Stats Cards */}
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
            loading={loading}
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

      {/* Quick Stats */}
      <div 
        className="p-6 rounded-2xl border"
        style={{ 
          backgroundColor: COLORS.surfaceSubtle, 
          borderColor: COLORS.border 
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3 
            className="font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Resumen Rápido
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p 
              className="text-xs uppercase tracking-wide"
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
          <div>
            <p 
              className="text-xs uppercase tracking-wide"
              style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Ingresos del período
            </p>
            <p 
              className="text-2xl font-bold"
              style={{ color: COLORS.success || '#16A34A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              €{data?.overview.revenue || 0}
            </p>
          </div>
          <div>
            <p 
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              €{data?.overview.revenue || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
