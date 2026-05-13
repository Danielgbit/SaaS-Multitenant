'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import type { QueueItemStatus } from '@/types/notifications'

const STATUS_CONFIG: Record<QueueItemStatus, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: 'Pendiente', bgColor: '#64748B20', textColor: '#64748B' },
  processing: { label: 'Procesando', bgColor: '#0EA5E920', textColor: '#0EA5E9' },
  sent: { label: 'Enviado', bgColor: '#6366F120', textColor: '#6366F1' },
  delivered: { label: 'Entregado', bgColor: '#16A34A20', textColor: '#16A34A' },
  read: { label: 'Leído', bgColor: '#05966920', textColor: '#059669' },
  failed: { label: 'Fallido', bgColor: '#DC262620', textColor: '#DC2626' },
  failed_permanently: { label: 'Fallido permanente', bgColor: '#7F1D1D20', textColor: '#991B1B' },
  cancelled: { label: 'Cancelado', bgColor: '#47556920', textColor: '#475569' },
}

interface StatusBadgeProps {
  status: QueueItemStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
      role="status"
      aria-label={`Estado: ${config.label}`}
    >
      {config.label}
    </span>
  )
}