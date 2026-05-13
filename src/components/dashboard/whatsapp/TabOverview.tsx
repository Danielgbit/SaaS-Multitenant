'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { StatCard } from './StatCard'
import { AlertBanner } from './AlertBanner'
import { StatusBadge } from './StatusBadge'
import { getQueueStats, getRecentItems, type QueueStats } from '@/actions/notifications/queue'
import type { NotificationQueueItem } from '@/types/notifications'

interface TabOverviewProps {
  organizationId: string
}

export function TabOverview({ organizationId }: TabOverviewProps) {
  const COLORS = useThemeColors()
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [recentItems, setRecentItems] = useState<NotificationQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    const [statsResult, recentResult] = await Promise.all([
      getQueueStats(organizationId),
      getRecentItems(organizationId, 10),
    ])

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    } else if (statsResult.error) {
      setError(statsResult.error)
    }

    if (recentResult.success && recentResult.data) {
      setRecentItems(recentResult.data)
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const showStuckAlert = stats && stats.stuckCount > 0 && !dismissedAlerts.has('stuck')
  const showFailureAlert = stats && stats.sentToday > 0 && (stats.failedToday / (stats.sentToday + stats.failedToday)) > 0.3 && !dismissedAlerts.has('failure')

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const maskAddress = (address: string) => {
    if (address.includes('@')) {
      const [user, domain] = address.split('@')
      return `${user.slice(0, 2)}***@${domain}`
    }
    const phone = address.replace(/\D/g, '')
    return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} *** ${phone.slice(-4)}`
  }

  if (error) {
    return (
      <div className="p-6">
        <AlertBanner type="error" message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(showStuckAlert || showFailureAlert) && (
        <div className="space-y-3">
          {showStuckAlert && (
            <AlertBanner
              type="warning"
              message={`Tienes ${stats!.stuckCount} mensaje(s) atascado(s) en procesamiento. El sistema los recuperará automáticamente.`}
              dismissible
              onDismiss={() => setDismissedAlerts((prev) => new Set([...prev, 'stuck']))}
            />
          )}
          {showFailureAlert && (
            <AlertBanner
              type="error"
              message={`Tu tasa de fallo está por encima del 30%. Revisa la cola para identificar problemas.`}
              dismissible
              onDismiss={() => setDismissedAlerts((prev) => new Set([...prev, 'failure']))}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Enviados hoy"
          value={stats?.sentToday ?? 0}
          color={COLORS.primary}
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Entregados hoy"
          value={stats?.deliveredToday ?? 0}
          color={COLORS.success}
          loading={loading}
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Fallidos hoy"
          value={stats?.failedToday ?? 0}
          color={COLORS.error}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pendientes"
          value={stats?.pending ?? 0}
          color={COLORS.warning}
          loading={loading}
        />
      </div>

      <div
        className="p-4 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Tasa de entrega
            </span>
          </div>
          <span
            className="text-2xl font-bold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {stats?.deliveryRate ?? 0}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: COLORS.border }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stats?.deliveryRate ?? 0}%`,
              backgroundColor: COLORS.success,
            }}
          />
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: COLORS.border,
        }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Mensajes recientes
          </span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div
                  className="w-10 h-10 rounded-xl"
                  style={{ backgroundColor: COLORS.textMuted + '20' }}
                />
                <div className="flex-1">
                  <div
                    className="h-4 w-32 rounded mb-1"
                    style={{ backgroundColor: COLORS.textMuted + '20' }}
                  />
                  <div
                    className="h-3 w-24 rounded"
                    style={{ backgroundColor: COLORS.textMuted + '20' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              No hay mensajes recientes
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ backgroundColor: COLORS.surface }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: COLORS.whatsappLight }}
                >
                  <MessageCircle className="w-5 h-5" style={{ color: COLORS.whatsapp }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {maskAddress(item.toAddress)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: COLORS.textMuted }}
                  >
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}