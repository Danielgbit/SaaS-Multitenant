'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { 
  Calendar, 
  DollarSign, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Clock
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'

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
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

interface BusinessHealthWidgetProps {
  organizationId: string
}

export function BusinessHealthWidget({ organizationId }: BusinessHealthWidgetProps) {
  const COLORS = useColors()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    todayAppointments: number
    completedAppointments: number
    pendingConfirmations: number
    todayRevenue: number
    weekOccupancy: number
    topService: string
    topEmployee: string
    topEmployeeRevenue: number
  } | null>(null)

  useEffect(() => {
    let mounted = true
    loadData().then(() => {
      if (mounted) {
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [organizationId])

  const loadData = async () => {
    setLoading(true)
    
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const startOfWeek = monday.toISOString()
    const endOfWeek = new Date(monday.getDate() + 6).toISOString()

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      setLoading(false)
      return
    }

    const orgId = orgMember.organization_id

    const [
      appointmentsResult,
      completedResult,
      pendingResult,
      revenueResult,
      weekAppointmentsResult
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay),
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay),
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('status', 'pending')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay),
      supabase
        .from('appointment_services')
        .select('price')
        .gte('appointment:appointments!inner(start_time)', startOfDay)
        .lte('appointment:appointments!inner(start_time)', endOfDay)
        .eq('appointment:appointments.status', 'completed'),
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('start_time', startOfWeek)
        .lte('start_time', endOfWeek)
    ])

    const totalAppointments = appointmentsResult.count || 0
    const completedToday = completedResult.count || 0
    const pendingConfirmations = pendingResult.count || 0
    const todayRevenue = revenueResult.data?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) || 0

    const totalSlots = 8 * 7
    const weekOccupancy = weekAppointmentsResult.count 
      ? Math.round((weekAppointmentsResult.count / totalSlots) * 100) 
      : 0

    setData({
      todayAppointments: totalAppointments,
      completedAppointments: completedToday,
      pendingConfirmations,
      todayRevenue,
      weekOccupancy,
      topService: 'Masaje Relajante',
      topEmployee: 'María G.',
      topEmployeeRevenue: 450000
    })
  }

  if (loading) {
    return (
      <div
        className="p-4 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: COLORS.textMuted + '30' }} />
          <div className="w-24 h-4 rounded" style={{ backgroundColor: COLORS.textMuted + '30' }} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-16 h-3 rounded" style={{ backgroundColor: COLORS.textMuted + '20' }} />
              <div className="w-12 h-6 rounded" style={{ backgroundColor: COLORS.textMuted + '30' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const completionRate = data && data.todayAppointments > 0 
    ? Math.round((data.completedAppointments / data.todayAppointments) * 100) 
    : 0

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div 
        className="p-4 border-b"
        style={{ 
          background: COLORS.primaryGradient,
          borderColor: 'transparent'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Resumen de Hoy
            </h3>
          </div>
          <span className="text-xs text-white/80">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Citas</span>
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
              {data?.completedAppointments}/{data?.todayAppointments}
            </p>
          </div>

          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4" style={{ color: COLORS.success }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Ingresos</span>
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.success }}>
              {formatCurrencyCOP(data?.todayRevenue || 0)}
            </p>
          </div>

          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.success }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Comp.</span>
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.success }}>
              {completionRate}%
            </p>
          </div>

          <div className="text-center p-3 rounded-xl" style={{ 
            backgroundColor: (data?.pendingConfirmations || 0) > 0 ? COLORS.warningLight : COLORS.surfaceSubtle 
          }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="w-4 h-4" style={{ color: (data?.pendingConfirmations || 0) > 0 ? COLORS.warning : COLORS.textMuted }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Sin confirmar</span>
            </div>
            <p className="text-xl font-bold" style={{ color: (data?.pendingConfirmations || 0) > 0 ? COLORS.warning : COLORS.textPrimary }}>
              {data?.pendingConfirmations || 0}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.textSecondary }}>Ocupación semana</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${data?.weekOccupancy || 0}%`,
                    backgroundColor: (data?.weekOccupancy || 0) > 80 ? COLORS.success : COLORS.primary
                  }}
                />
              </div>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                {data?.weekOccupancy || 0}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.textSecondary }}>Top servicio</span>
            <span className="font-medium" style={{ color: COLORS.textPrimary }}>
              {data?.topService}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.textSecondary }}>Top empleado</span>
            <div className="flex items-center gap-2">
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                {data?.topEmployee}
              </span>
              <span style={{ color: COLORS.success, fontSize: '12px' }}>
                {formatCurrencyCOP(data?.topEmployeeRevenue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="p-3 border-t"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
      >
        <Link
          href="/calendar"
          className="flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: COLORS.primary }}
        >
          Ir al calendario
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}