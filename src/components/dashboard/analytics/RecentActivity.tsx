'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Activity, CheckCircle2, XCircle, UserPlus, Clock, Loader2 } from 'lucide-react'
import { getRecentActivity } from '@/actions/analytics/getRecentActivity'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
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
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    info: '#0EA5E9',
    infoLight: isDark ? '#0c4a6e' : '#E0F2FE',
    isDark,
  }
}

interface Activity {
  id: string
  type: 'appointment_created' | 'appointment_completed' | 'appointment_cancelled' | 'client_registered'
  title: string
  description: string
  timestamp: string
}

interface RecentActivityProps {
  organizationId: string
}

export function RecentActivity({ organizationId }: RecentActivityProps) {
  const COLORS = useColors()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [organizationId])

  const loadActivities = async () => {
    setLoading(true)
    const result = await getRecentActivity(organizationId, 8)
    if (result.success && result.data) {
      setActivities(result.data)
    }
    setLoading(false)
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'appointment_completed':
        return { icon: <CheckCircle2 className="w-4 h-4" />, color: COLORS.success, bg: COLORS.successLight }
      case 'appointment_cancelled':
        return { icon: <XCircle className="w-4 h-4" />, color: COLORS.error, bg: COLORS.errorLight }
      case 'client_registered':
        return { icon: <UserPlus className="w-4 h-4" />, color: COLORS.info, bg: COLORS.infoLight }
      case 'appointment_created':
      default:
        return { icon: <Clock className="w-4 h-4" />, color: COLORS.warning, bg: COLORS.warningLight }
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Hace ${diffMins}min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
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
            <Activity className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Actividad Reciente</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: COLORS.surfaceSubtle }} />
              <div className="flex-1">
                <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor: COLORS.surfaceSubtle }} />
                <div className="h-3 w-24 rounded" style={{ backgroundColor: COLORS.surfaceSubtle }} />
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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
          <Activity className="w-5 h-5" style={{ color: COLORS.primary }} />
        </div>
        <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Actividad Reciente</h3>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <Activity className="w-6 h-6" style={{ color: COLORS.textMuted }} />
          </div>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>Sin actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, index) => {
            const style = getActivityIcon(activity.type)
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                    {activity.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: COLORS.textSecondary }}>
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
