'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { MessageCircle, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, Wifi, Webhook, Activity, RefreshCw, Inbox } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertBanner } from './AlertBanner'
import { StatusBadge } from './StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { getQueueStats, getRecentItems, type QueueStats } from '@/actions/notifications/queue'
import { getProvider } from '@/actions/notifications/providers'
import type { NotificationQueueItem, NotificationProvider } from '@/types/notifications'

interface TabOverviewProps {
  organizationId: string
}

interface SystemStatus {
  provider: 'connected' | 'disconnected' | 'unknown'
  webhook: 'active' | 'inactive' | 'unknown'
  queue: 'processing' | 'idle' | 'unknown'
  lastActivity: string | null
  lastActivityRaw: string | null
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const date = new Date(isoString).getTime()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin}m`
  if (diffHour < 24) return `Hace ${diffHour}h`
  return new Date(isoString).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function TabOverview({ organizationId }: TabOverviewProps) {
  const COLORS = useThemeColors()
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [recentItems, setRecentItems] = useState<NotificationQueueItem[]>([])
  const [provider, setProvider] = useState<NotificationProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    const [statsResult, recentResult, providerResult] = await Promise.all([
      getQueueStats(organizationId),
      getRecentItems(organizationId, 10),
      getProvider(organizationId, 'whatsapp'),
    ])

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    } else if (statsResult.error) {
      setError(statsResult.error)
    }

    if (recentResult.success && recentResult.data) {
      setRecentItems(recentResult.data)
    }

    if (providerResult.success && providerResult.data) {
      setProvider(providerResult.data)
    }

    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    startTransition(() => {
      loadData()
    })
    const interval = setInterval(() => startTransition(() => loadData()), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const showStuckAlert = stats && stats.stuckCount > 0 && !dismissedAlerts.has('stuck')
  const showFailureAlert = stats && stats.sentToday > 0 && (stats.failedToday / (stats.sentToday + stats.failedToday)) > 0.3 && !dismissedAlerts.has('failure')

  const getSystemStatus = (): SystemStatus => {
    let providerStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown'
    let webhookStatus: 'active' | 'inactive' | 'unknown' = 'unknown'
    let queueStatus: 'processing' | 'idle' | 'unknown' = 'unknown'

    if (provider) {
      providerStatus = provider.isEnabled ? 'connected' : 'disconnected'
      const webhookUrl = provider.config?.webhook_url as string | undefined
      webhookStatus = webhookUrl ? 'active' : 'inactive'
    }

    if (stats) {
      queueStatus = stats.pending > 0 || stats.stuckCount > 0 ? 'processing' : 'idle'
    }

    return {
      provider: providerStatus,
      webhook: webhookStatus,
      queue: queueStatus,
      lastActivity: recentItems[0]?.createdAt ? formatRelativeTime(recentItems[0].createdAt) : null,
      lastActivityRaw: recentItems[0]?.createdAt || null,
    }
  }

  const systemStatus = getSystemStatus()

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

  const statusItems = [
    {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: 'Proveedor',
      value: systemStatus.provider === 'connected' ? 'Conectado' : systemStatus.provider === 'disconnected' ? 'Desconectado' : 'Sin configurar',
      color: systemStatus.provider === 'connected' ? COLORS.success : systemStatus.provider === 'disconnected' ? COLORS.error : COLORS.textMuted,
      dotColor: systemStatus.provider === 'connected' ? COLORS.success : systemStatus.provider === 'disconnected' ? COLORS.error : COLORS.textMuted,
    },
    {
      icon: <Webhook className="w-3.5 h-3.5" />,
      label: 'Webhook',
      value: systemStatus.webhook === 'active' ? 'Activo' : systemStatus.webhook === 'inactive' ? 'Inactivo' : 'Sin configurar',
      color: systemStatus.webhook === 'active' ? COLORS.success : systemStatus.webhook === 'inactive' ? COLORS.warning : COLORS.textMuted,
      dotColor: systemStatus.webhook === 'active' ? COLORS.success : systemStatus.webhook === 'inactive' ? COLORS.warning : COLORS.textMuted,
    },
    {
      icon: <Activity className="w-3.5 h-3.5" />,
      label: 'Cola',
      value: systemStatus.queue === 'processing' ? 'Procesando' : systemStatus.queue === 'idle' ? 'Activa' : '—',
      color: systemStatus.queue === 'processing' ? COLORS.primary : systemStatus.queue === 'idle' ? COLORS.success : COLORS.textMuted,
      dotColor: systemStatus.queue === 'processing' ? COLORS.primary : systemStatus.queue === 'idle' ? COLORS.success : COLORS.textMuted,
    },
    {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Última actividad',
      value: systemStatus.lastActivity ?? 'Sin actividad',
      color: systemStatus.lastActivity ? COLORS.textSecondary : COLORS.textMuted,
      dotColor: COLORS.textMuted,
    },
  ]

  if (error) {
    return (
      <div className="p-6">
        <AlertBanner type="error" message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
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

      <Card variant="glass">
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Estado del sistema
            </span>
            <span className="flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75"
                style={{ backgroundColor: COLORS.success }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: COLORS.success }} />
            </span>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textMuted }}
            aria-label="Actualizar estado"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0" style={{ borderColor: COLORS.border }}>
          {statusItems.map((item) => (
            <div key={item.label} className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: item.color }}>{item.icon}</span>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: item.dotColor }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: item.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          <>
            <Card variant="glass" className="p-5"><Skeleton variant="metric" /></Card>
            <Card variant="glass" className="p-5"><Skeleton variant="metric" /></Card>
            <Card variant="glass" className="p-5"><Skeleton variant="metric" /></Card>
            <Card variant="glass" className="p-5"><Skeleton variant="metric" /></Card>
          </>
        ) : (
          <>
            <MetricCard
              title="Enviados hoy"
              value={stats?.sentToday ?? 0}
              icon={<MessageCircle className="w-4 h-4" />}
              iconColor={COLORS.primary}
            />
            <MetricCard
              title="Entregados"
              value={stats?.deliveredToday ?? 0}
              icon={<CheckCircle className="w-4 h-4" />}
              iconColor={COLORS.success}
            />
            <MetricCard
              title="Fallidos"
              value={stats?.failedToday ?? 0}
              icon={<XCircle className="w-4 h-4" />}
              iconColor={COLORS.error}
            />
            <MetricCard
              title="Pendientes"
              value={stats?.pending ?? 0}
              icon={<Clock className="w-4 h-4" />}
              iconColor={COLORS.warning}
            />
          </>
        )}
      </div>

      <Card variant="glass" className="p-4">
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
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {stats?.deliveryRate ?? 0}%
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
              {(stats?.sentToday ?? 0) + (stats?.failedToday ?? 0)} envios
            </span>
          </div>
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
      </Card>

      <Card variant="bordered">
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Mensajes recientes
          </span>
          {systemStatus.lastActivityRaw && (
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {systemStatus.lastActivity}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" width="w-9" height="h-9" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" width="w-36" height="h-4" />
                  <Skeleton variant="text" width="w-24" height="h-3" />
                </div>
                <Skeleton variant="rectangular" width="w-16" height="h-5" />
              </div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <Card variant="bordered" className="py-12">
            <EmptyState
              icon={<Inbox className="w-7 h-7" style={{ color: COLORS.textMuted }} />}
              title="Sin mensajes recientes"
              description="Los mensajes enviados aparecerán aquí"
            />
          </Card>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ backgroundColor: COLORS.surface }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: COLORS.whatsappLight }}
                >
                  <MessageCircle className="w-4 h-4" style={{ color: COLORS.whatsapp }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {maskAddress(item.toAddress)}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}