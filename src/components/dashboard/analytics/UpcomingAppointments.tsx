'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Calendar, Clock, User, Scissors, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getUpcomingAppointments } from '@/actions/analytics/getUpcomingAppointments'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' 
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    primarySubtle: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 76, 92, 0.08)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    isDark,
  }
}

interface UpcomingAppointment {
  id: string
  start_time: string
  status: string
  client_name: string
  client_phone: string | null
  service_name: string | null
  employee_name: string | null
}

interface UpcomingAppointmentsProps {
  organizationId: string
}

export function UpcomingAppointments({ organizationId }: UpcomingAppointmentsProps) {
  const COLORS = useColors()
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [organizationId])

  const loadAppointments = async () => {
    setLoading(true)
    const result = await getUpcomingAppointments(organizationId, 5)
    if (result.success && result.data) {
      setAppointments(result.data)
    }
    setLoading(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: COLORS.successLight, color: COLORS.success }
      case 'pending':
        return { bg: COLORS.warningLight, color: COLORS.warning }
      default:
        return { bg: COLORS.surfaceSubtle, color: COLORS.textMuted }
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border" style={{ 
        backgroundColor: COLORS.surfaceGlass,
        backdropFilter: 'blur(12px)',
        borderColor: COLORS.border,
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
            <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Próximas Citas</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: COLORS.surfaceSubtle }} />
              <div className="flex-1">
                <div className="h-4 w-24 rounded mb-2" style={{ backgroundColor: COLORS.surfaceSubtle }} />
                <div className="h-3 w-16 rounded" style={{ backgroundColor: COLORS.surfaceSubtle }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="p-6 rounded-2xl border transition-all duration-300"
      style={{ 
        backgroundColor: COLORS.surfaceGlass,
        backdropFilter: 'blur(12px)',
        borderColor: COLORS.border,
        boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
            <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Próximas Citas</h3>
        </div>
        <Link 
          href="/calendar"
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: COLORS.primary }}
        >
          Ver todas
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <Calendar className="w-6 h-6" style={{ color: COLORS.textMuted }} />
          </div>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>No hay citas programadas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => {
            const statusStyle = getStatusColor(apt.status)
            return (
              <div 
                key={apt.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
                  <span className="text-sm font-bold" style={{ color: COLORS.primary }}>
                    {formatTime(apt.start_time)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: COLORS.textPrimary }}>
                    {apt.client_name}
                  </p>
                  <div className="flex items-center gap-2">
                    {apt.service_name && (
                      <span className="text-xs flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
                        <Scissors className="w-3 h-3" />
                        {apt.service_name}
                      </span>
                    )}
                    {apt.employee_name && (
                      <span className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                        <User className="w-3 h-3" />
                        {apt.employee_name}
                      </span>
                    )}
                  </div>
                </div>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                >
                  {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
