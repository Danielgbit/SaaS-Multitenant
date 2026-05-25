'use client'

import { Activity, CheckCircle2, XCircle, UserPlus, Clock } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ActivityItem, RecentActivityProps } from '@/types/analytics'

export function RecentActivity({ activities }: RecentActivityProps) {
  const COLORS = useThemeColors()

  const getActivityIcon = (type: ActivityItem['type']) => {
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

  return (
    <Card variant="surface" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
          <Activity className="w-5 h-5" style={{ color: COLORS.primary }} />
        </div>
        <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Actividad Reciente</h3>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-6 h-6" style={{ color: COLORS.textMuted }} />}
          title="Sin actividad reciente"
        />
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const style = getActivityIcon(activity.type)
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
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
    </Card>
  )
}
