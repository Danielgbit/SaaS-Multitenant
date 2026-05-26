'use client'

import { Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PAYROLL_STATUS_CONFIG } from '@/lib/payroll/constants'

export function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: { variant: 'warning' as const, icon: Clock, label: PAYROLL_STATUS_CONFIG.draft.label },
    approved: { variant: 'primary' as const, icon: CheckCircle, label: PAYROLL_STATUS_CONFIG.approved.label },
    paid: { variant: 'success' as const, icon: CheckCircle, label: PAYROLL_STATUS_CONFIG.paid.label },
  }[status] || { variant: 'neutral' as const, icon: Clock, label: status }

  const Icon = config.icon

  return (
    <Badge variant={config.variant} size="md" className="gap-1.5">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}

export function ContractTypeBadge({ type }: { type: string }) {
  const variant = type === 'laboral' ? 'primary' : 'success'
  return (
    <Badge variant={variant} size="sm">
      {type === 'laboral' ? 'Laboral' : 'Prestación'}
    </Badge>
  )
}

export function PaymentTypeBadge({ type }: { type: string }) {
  const config = {
    fijo: { variant: 'primary' as const, label: 'Fijo' },
    porcentaje: { variant: 'warning' as const, label: 'Comisión' },
    mixed: { variant: 'info' as const, label: 'Mixto' },
  }[type] || { variant: 'neutral' as const, label: type }

  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  )
}
