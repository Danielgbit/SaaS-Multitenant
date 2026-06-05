'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { MetricCard } from '@/components/ui'
import {
  Package, Activity, AlertTriangle, RefreshCw, TrendingUp, Clock, Shield,
} from 'lucide-react'
import type { InventoryMetrics } from '@/lib/metrics/getInventoryMetrics'
import { DivergenceCard } from './DivergenceCard'

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  warning: 'Advertencia',
  critical: 'Crítico',
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export function MetricsClient({ metrics, organizationId }: { metrics: InventoryMetrics; organizationId: string }) {
  const COLORS = useThemeColors()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6" style={{ color: COLORS.primary }} />
        <h1 className="text-2xl font-bold font-heading" style={{ color: COLORS.textPrimary }}>
          Métricas de Inventario
        </h1>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cobertura del Ledger"
          value={metrics.ledger_coverage_pct}
          suffix="%"
          icon={<Shield />}
          iconColor={metrics.ledger_coverage_pct > 80 ? COLORS.success : COLORS.warning}
        />

        <MetricCard
          title="Movimientos Hoy"
          value={metrics.movements_today}
          icon={<Activity />}
          iconColor={COLORS.primary}
        />

        <MetricCard
          title="Movimientos Semana"
          value={metrics.movements_week}
          icon={<TrendingUp />}
          iconColor={COLORS.accentTeal}
        />

        <MetricCard
          title="Items sin Historial"
          value={metrics.items_without_movements}
          icon={<Package />}
          iconColor={metrics.items_without_movements > 0 ? COLORS.warning : COLORS.success}
          footer={`de ${metrics.total_items} totales`}
        />

        <MetricCard
          title="Divergencias Abiertas"
          value={metrics.open_divergences}
          icon={<AlertTriangle />}
          iconColor={metrics.open_divergences > 0 ? COLORS.error : COLORS.success}
        />

        <MetricCard
          title="Anulaciones (24h)"
          value={metrics.void_events_24h}
          icon={<RefreshCw />}
          iconColor={metrics.void_events_24h > 0 ? COLORS.warning : COLORS.success}
        />

        <MetricCard
          title="Estado del reconciliador"
          value={STATUS_LABELS[metrics.cron_status ?? ''] || 'Desconocido'}
          icon={<Activity />}
          iconColor={metrics.cron_status === 'healthy' ? COLORS.success : COLORS.warning}
          footer={
            metrics.heartbeat_age_minutes !== null
              ? `último heartbeat hace ${metrics.heartbeat_age_minutes} min`
              : 'sin heartbeat registrado'
          }
        />

        <MetricCard
          title="Última Reconciliación"
          value={metrics.last_cron_heartbeat ? timeAgo(metrics.last_cron_heartbeat) : 'Nunca'}
          icon={<Clock />}
          iconColor={metrics.cron_status === 'healthy' ? COLORS.success : COLORS.warning}
        />
      </div>

      {metrics.open_divergences_list && metrics.open_divergences_list.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold font-heading mb-4" style={{ color: COLORS.textPrimary }}>
            Divergencias abiertas
          </h2>
          <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
            {metrics.open_divergences_list.length} de {metrics.open_divergences} divergencias visibles
          </p>
          <div className="space-y-3">
            {metrics.open_divergences_list.map(div => (
              <DivergenceCard
                key={div.id}
                divergence={div}
                organizationId={organizationId}
                onResolved={() => window.location.reload()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
