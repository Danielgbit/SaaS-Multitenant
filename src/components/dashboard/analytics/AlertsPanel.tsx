'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Bell, AlertTriangle, CheckCircle2, Loader2, MessageCircle, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getSystemAlerts } from '@/actions/analytics/getSystemAlerts'

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
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

interface Alert {
  id: string
  type: 'whatsapp_failed' | 'unconfirmed_appointment' | 'info'
  severity: 'warning' | 'info' | 'success'
  title: string
  description: string
  link?: string
  linkLabel?: string
  count: number
}

interface AlertsPanelProps {
  organizationId: string
}

export function AlertsPanel({ organizationId }: AlertsPanelProps) {
  const COLORS = useColors()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [organizationId])

  const loadAlerts = async () => {
    setLoading(true)
    const result = await getSystemAlerts(organizationId)
    if (result.success && result.data) {
      setAlerts(result.data)
    }
    setLoading(false)
  }

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

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border" style={{ 
        backgroundColor: COLORS.surfaceGlass,
        backdropFilter: 'blur(12px)',
        borderColor: COLORS.border,
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
            <Bell className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Alertas</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: COLORS.surfaceSubtle }} />
              <div className="flex-1">
                <div className="h-4 w-32 rounded mb-1" style={{ backgroundColor: COLORS.surfaceSubtle }} />
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
          <Bell className="w-5 h-5" style={{ color: COLORS.primary }} />
        </div>
        <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Alertas</h3>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const style = getAlertIcon(alert)
          const isSuccess = alert.severity === 'success'
          
          return (
            <div 
              key={alert.id}
              className={`
                flex items-start gap-3 p-3 rounded-xl transition-all duration-200
                ${alert.link ? 'cursor-pointer' : ''}
              `}
              style={{ backgroundColor: COLORS.surfaceSubtle }}
              onMouseEnter={(e) => {
                if (alert.link) {
                  e.currentTarget.style.backgroundColor = COLORS.border
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle
              }}
              onClick={() => {
                if (alert.link) {
                  window.location.href = alert.link
                }
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
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: style.bg, color: style.color }}>
                      {alert.count}
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                  {alert.description}
                </p>
              </div>
              {alert.link && (
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: COLORS.textMuted }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
