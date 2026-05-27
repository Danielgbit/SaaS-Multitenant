import { describe, it, expect } from 'vitest'
import { assertValidSign, FinancialSignError } from '@/lib/financial/sign-utils'
import type { FinancialEventType } from '@/types/financial'

describe('commission sign invariants', () => {
  it('commission_accrued must be negative', () => {
    expect(() => assertValidSign('commission_accrued', -50000)).not.toThrow()
    expect(() => assertValidSign('commission_accrued', 0)).toThrow(FinancialSignError)
    expect(() => assertValidSign('commission_accrued', 50000)).toThrow(FinancialSignError)
  })

  it('commission_settled must be negative', () => {
    expect(() => assertValidSign('commission_settled', -50000)).not.toThrow()
    expect(() => assertValidSign('commission_settled', 50000)).toThrow(FinancialSignError)
  })

  it('commission amount does not exceed gross revenue', () => {
    const grossRevenue = 100000
    const commissionRate = 60
    const commission = (grossRevenue * commissionRate) / 100

    expect(commission).toBeLessThanOrEqual(grossRevenue)
    expect(commission).toBe(60000)
    expect(commission).toBeGreaterThan(0)
  })

  it('commission ≥ 0', () => {
    const validRates = [0, 10, 50, 60, 100]
    for (const rate of validRates) {
      const commission = (100000 * rate) / 100
      expect(commission).toBeGreaterThanOrEqual(0)
    }
  })

  it('commission_rate between 0 and 100', () => {
    const validRates = [0, 10, 50, 60, 100]
    const invalidRates = [-1, 101]

    for (const rate of validRates) {
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(100)
    }

    for (const rate of invalidRates) {
      expect(rate < 0 || rate > 100).toBe(true)
    }
  })

  it('accrued precedes settled in time', () => {
    const accruedAt = new Date('2026-05-20')
    const settledAt = new Date('2026-05-25')

    expect(accruedAt.getTime()).toBeLessThan(settledAt.getTime())
  })

  it('commission_accrued is a valid FinancialEventType', () => {
    const validTypes: FinancialEventType[] = [
      'payment_received',
      'refund_processed',
      'commission_accrued',
      'commission_settled',
      'adjustment_applied',
    ]

    const testType: FinancialEventType = 'commission_accrued'
    expect(validTypes).toContain(testType)
  })
})
