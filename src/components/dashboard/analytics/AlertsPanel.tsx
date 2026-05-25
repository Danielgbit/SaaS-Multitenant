'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Calendar, CheckCircle2, Bell, ChevronRight, X } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import type { Alert, AlertsPanelProps } from '@/types/analytics'

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const COLORS = useThemeColors()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id))

  const getAlertIcon = (alert: Alert) => {
    switch (alert.type) {
      case 'whatsapp_failed':
        return { icon: <MessageCircle className="w-4 h-4" />, color: COLORS.error, bg: COLORS.errorLight }
      case 'unconfirmed_appointment':
        return { icon: <Calendar className="w-4 h-4" />, color: COLORS.warning, bg: COLORS.warningLight }
      case 'info':
        return { icon: <CheckCircle2 className="w-4 h-4" />, color: COLORS.success, bg: COLORS.successLight }
      default:
        return { icon: <Bell className="w-4 h-4" />, color: COLORS.primary, bg: COLORS.primarySubtle }
    }
  }

  const getBadgeVariant = (severity: string): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (severity) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'neutral'
    }
  }

  if (visibleAlerts.length === 0) return null

  return (
    <Card variant="surface" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
          <Bell className="w-5 h-5" style={{ color: COLORS.primary }} />
        </div>
        <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Alertas</h3>
      </div>

      <div className="space-y-2">
        {visibleAlerts.map((alert) => {
          const style = getAlertIcon(alert)
          
          return (
            <div key={alert.id} className="group relative">
              <Link
                href={alert.link || '#'}
                className={`
                  flex items-start gap-3 p-3 rounded-xl transition-colors
                  ${alert.link ? 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer' : ''}
                `}
                style={{ backgroundColor: COLORS.surfaceSubtle }}
                onClick={(e) => {
                  if (!alert.link) e.preventDefault()
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>
                    {alert.title}
                    {alert.count > 0 && (
                      <Badge variant={getBadgeVariant(alert.severity)} size="sm" className="ml-2">
                        {alert.count}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    {alert.description}
                  </p>
                </div>
                {alert.link ? (
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: COLORS.textMuted }} />
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDismissedIds(prev => new Set(prev).add(alert.id))
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600"
                    title="Descartar"
                    type="button"
                  >
                    <X className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                  </button>
                )}
              </Link>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
