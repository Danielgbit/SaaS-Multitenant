import type { FinancialEventType } from '@/types/financial'

export class FinancialSignError extends Error {
  constructor(eventType: FinancialEventType, amount: number) {
    super(`Invalid sign for ${eventType}: amount must be ${getSignDescription(eventType)}, got ${amount}`)
    this.name = 'FinancialSignError'
  }
}

function getSignDescription(eventType: FinancialEventType): string {
  switch (eventType) {
    case 'payment_received':
      return 'positive (> 0)'
    case 'refund_processed':
    case 'commission_accrued':
    case 'commission_settled':
      return 'negative (< 0)'
    case 'adjustment_applied':
      return 'non-zero (≠ 0)'
    default:
      return 'any'
  }
}

export function assertValidSign(eventType: FinancialEventType, amount: number): void {
  switch (eventType) {
    case 'payment_received':
      if (amount <= 0) throw new FinancialSignError(eventType, amount)
      break
    case 'refund_processed':
    case 'commission_accrued':
    case 'commission_settled':
      if (amount >= 0) throw new FinancialSignError(eventType, amount)
      break
    case 'adjustment_applied':
      if (amount === 0) throw new FinancialSignError(eventType, amount)
      break
  }
}
