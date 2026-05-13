'use client'

import { Clock, CheckCircle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { PAYROLL_STATUS_CONFIG } from '@/lib/payroll/constants'
import type { PeriodStatus } from '@/types/payroll'

const STATUS_CONFIG = {
  draft: { icon: Clock, label: PAYROLL_STATUS_CONFIG.draft.label },
  approved: { icon: CheckCircle, label: PAYROLL_STATUS_CONFIG.approved.label },
  paid: { icon: CheckCircle, label: PAYROLL_STATUS_CONFIG.paid.label },
} as const

interface StatusBadgeProps {
  status: PeriodStatus | string
  showPulse?: boolean
}

export function StatusBadge({ status, showPulse }: StatusBadgeProps) {
  const colors = useThemeColors()
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    icon: Clock,
    label: status,
  }
  const Icon = config.icon

  const colorMap: Record<string, string> = {
    draft: colors.warning,
    approved: colors.primary,
    paid: colors.success,
  }
  const statusColor = colorMap[status] || colors.textMuted
  const shouldPulse = showPulse ?? (status === 'approved' || status === 'paid')

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: statusColor + '20', color: statusColor }}
      role="status"
      aria-label={`Estado: ${config.label}`}
    >
      {shouldPulse ? (
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: statusColor }}
          />
        </span>
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {config.label}
    </span>
  )
}
