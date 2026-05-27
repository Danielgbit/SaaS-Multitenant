export type FinancialEventType =
  // Operational (no financieros)
  | 'appointment_confirmed'
  | 'appointment_completed'
  | 'appointment_cancelled'

  // Financial (mutan estado financiero)
  | 'payment_received'
  | 'refund_processed'
  | 'commission_accrued'
  | 'commission_settled'
  | 'adjustment_applied'

export type FinancialEventStatus = 'pending' | 'settled' | 'reversed'

export type EntityType = 'appointment' | 'client' | 'payroll' | 'invoice'

export type OccurredByType = 'user' | 'worker' | 'system'

export interface FinancialEvent {
  id: string
  organization_id: string
  event_type: FinancialEventType
  source_table: string
  source_id: string
  entity_type: EntityType
  entity_id: string
  occurred_by_type: OccurredByType
  occurred_by_id: string | null
  amount: number
  currency: string
  idempotency_key: string | null
  status: FinancialEventStatus
  version: number
  metadata: Record<string, unknown>
  occurred_at: string
  created_at: string
}

/**
 * Sign convention for amounts:
 *   payment_received     → positive
 *   refund_processed     → negative
 *   commission_accrued   → negative
 *   commission_settled   → negative
 *   adjustment_applied   → positive or negative
 */

export function formatFinancialAmount(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function getAmountSign(amount: number): '+' | '-' | '±' {
  if (amount > 0) return '+'
  if (amount < 0) return '-'
  return '±'
}
