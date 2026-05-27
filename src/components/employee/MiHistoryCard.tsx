'use client'

import { useMemo } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { ServiceHistory } from '@/types/employee-metrics'

interface Props {
  history: ServiceHistory[]
}

function statusIcon(status: ServiceHistory['status']) {
  switch (status) {
    case 'completed': return <CheckCircle className="w-3.5 h-3.5" />
    case 'confirmed': return <Clock className="w-3.5 h-3.5" />
    case 'cancelled': return <XCircle className="w-3.5 h-3.5" />
    case 'no_show': return <AlertCircle className="w-3.5 h-3.5" />
  }
}

function statusColor(status: ServiceHistory['status'], colors: ReturnType<typeof useThemeColors>): string {
  switch (status) {
    case 'completed': return colors.success
    case 'confirmed': return colors.primary
    case 'cancelled': return colors.error
    case 'no_show': return colors.warning
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dateOnly = new Date(d)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) return 'Hoy'
  if (dateOnly.getTime() === yesterday.getTime()) return 'Ayer'

  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function MiHistoryCard({ history }: Props) {
  const colors = useThemeColors()

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceHistory[]>()
    for (const item of history) {
      const key = item.date.substring(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return [...map.entries()].slice(0, 7)
  }, [history])

  if (history.length === 0) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <p className="text-sm" style={{ color: colors.textMuted }}>
          No hay servicios realizados en los últimos 30 días.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
        Últimos servicios
      </h3>

      <div className="space-y-3">
        {grouped.map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.textSecondary }}>
              {dateLabel === items[0].date.substring(0, 10)
                ? formatDate(items[0].date)
                : dateLabel}
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: colors.surfaceSubtle }}
                >
                  <span style={{ color: statusColor(item.status, colors) }}>
                    {statusIcon(item.status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                      {item.serviceName}
                    </p>
                    <p className="text-xs truncate" style={{ color: colors.textMuted }}>
                      {item.clientName}
                    </p>
                  </div>
                  <span className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                    ${item.servicePrice.toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
