'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { Badge } from '@/components/ui/Badge'
import type { QueueItemStatus } from '@/types/notifications'

interface StatusBadgeProps {
  status: QueueItemStatus
}

const statusConfig: Record<QueueItemStatus, { variant: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'neutral'; label: string; pulse?: boolean }> = {
  pending: { variant: 'neutral', label: 'Pendiente' },
  processing: { variant: 'info', label: 'Procesando', pulse: true },
  sent: { variant: 'primary', label: 'Enviado' },
  delivered: { variant: 'success', label: 'Entregado' },
  read: { variant: 'success', label: 'Leído' },
  failed: { variant: 'error', label: 'Fallido' },
  failed_permanently: { variant: 'error', label: 'Fallido permanente' },
  cancelled: { variant: 'neutral', label: 'Cancelado' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge variant={config.variant} size="md" pulse={config.pulse}>
      {config.label}
    </Badge>
  )
}