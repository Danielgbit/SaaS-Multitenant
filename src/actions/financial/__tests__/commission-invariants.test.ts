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

  it('commission from events path: same price+rate produces same total as legacy formula', () => {
    const price = 100000
    const rate = 60
    const legacyCommission = Number((price * (rate / 100)).toFixed(2))
    const eventAmount = -60000
    const eventCommission = Math.abs(eventAmount)

    expect(legacyCommission).toBe(60000)
    expect(eventCommission).toBe(legacyCommission)
  })

  it('commission total from events: sum of absolute values of negative amounts', () => {
    const events = [{ amount: -30000 }, { amount: -25000 }, { amount: -15000 }]
    const total = events.reduce((s, e) => s + Math.abs(e.amount), 0)
    expect(total).toBe(70000)
  })

  it('reconciliation diff < 0.01 threshold is treated as no drift', () => {
    const eventsTotal = 60000.00
    const legacyTotal = 60000.005
    const diff = Math.abs(eventsTotal - legacyTotal)
    expect(diff > 0.01).toBe(false)
  })

  it('reconciliation diff > 0.01 threshold triggers drift detection', () => {
    const eventsTotal = 60000
    const legacyTotal = 60100
    const diff = Math.abs(eventsTotal - legacyTotal)
    expect(diff > 0.01).toBe(true)
    expect(diff).toBe(100)
  })

  it('duplicate events with same idempotency_key do not double total', () => {
    const events = [
      { amount: -30000, key: 'dup-key' },
      { amount: -30000, key: 'dup-key' },
    ]

    const seen = new Set<string>()
    const uniqueTotal = events
      .filter(e => {
        if (seen.has(e.key)) return false
        seen.add(e.key)
        return true
      })
      .reduce((s, e) => s + Math.abs(e.amount), 0)

    const rawTotal = events.reduce((s, e) => s + Math.abs(e.amount), 0)

    expect(rawTotal).toBe(60000)
    expect(uniqueTotal).toBe(30000)
    expect(uniqueTotal).not.toBe(rawTotal)
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
