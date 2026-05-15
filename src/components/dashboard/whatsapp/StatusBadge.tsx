'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import type { QueueItemStatus } from '@/types/notifications'

interface StatusConfig {
  label: string
  bgColor: string
  textColor: string
}

interface StatusBadgeProps {
  status: QueueItemStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const COLORS = useThemeColors()

  const getStatusConfig = (): StatusConfig => {
    const config: Record<QueueItemStatus, StatusConfig> = {
      pending: {
        label: 'Pendiente',
        bgColor: COLORS.textMuted + '20',
        textColor: COLORS.textMuted,
      },
      processing: {
        label: 'Procesando',
        bgColor: COLORS.info + '20',
        textColor: COLORS.info,
      },
      sent: {
        label: 'Enviado',
        bgColor: COLORS.primary + '20',
        textColor: COLORS.primary,
      },
      delivered: {
        label: 'Entregado',
        bgColor: COLORS.success + '20',
        textColor: COLORS.success,
      },
      read: {
        label: 'Leído',
        bgColor: COLORS.success + '15',
        textColor: COLORS.success,
      },
      failed: {
        label: 'Fallido',
        bgColor: COLORS.error + '20',
        textColor: COLORS.error,
      },
      failed_permanently: {
        label: 'Fallido permanente',
        bgColor: COLORS.error + '15',
        textColor: COLORS.error,
      },
      cancelled: {
        label: 'Cancelado',
        bgColor: COLORS.textMuted + '15',
        textColor: COLORS.textMuted,
      },
    }
    return config[status] || config.pending
  }

  const config = getStatusConfig()

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
      role="status"
      aria-label={`Estado: ${config.label}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === 'processing' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.textColor }}
      />
      {config.label}
    </span>
  )
}