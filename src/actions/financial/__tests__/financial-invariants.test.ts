import { describe, it, expect, vi } from 'vitest'
import { assertValidSign, FinancialSignError } from '@/lib/financial/sign-utils'
import { IdempotencyGuard } from '@/lib/financial/idempotency-guard'
import { formatFinancialAmount, getAmountSign } from '@/types/financial'
import type { FinancialEventType, FinancialEvent } from '@/types/financial'

const FINANCIAL_TYPES: FinancialEventType[] = [
  'payment_received',
  'refund_processed',
  'commission_accrued',
  'commission_settled',
  'adjustment_applied',
]

describe('assertValidSign', () => {
  it('payment_received must be positive', () => {
    expect(() => assertValidSign('payment_received', 100)).not.toThrow()
    expect(() => assertValidSign('payment_received', 0)).toThrow(FinancialSignError)
    expect(() => assertValidSign('payment_received', -100)).toThrow(FinancialSignError)
  })

  it('refund_processed must be negative', () => {
    expect(() => assertValidSign('refund_processed', -100)).not.toThrow()
    expect(() => assertValidSign('refund_processed', 100)).toThrow(FinancialSignError)
    expect(() => assertValidSign('refund_processed', 0)).toThrow(FinancialSignError)
  })

  it('commission_accrued must be negative', () => {
    expect(() => assertValidSign('commission_accrued', -100)).not.toThrow()
    expect(() => assertValidSign('commission_accrued', 100)).toThrow(FinancialSignError)
  })

  it('commission_settled must be negative', () => {
    expect(() => assertValidSign('commission_settled', -100)).not.toThrow()
    expect(() => assertValidSign('commission_settled', 100)).toThrow(FinancialSignError)
  })

  it('adjustment_applied must be non-zero', () => {
    expect(() => assertValidSign('adjustment_applied', 100)).not.toThrow()
    expect(() => assertValidSign('adjustment_applied', -100)).not.toThrow()
    expect(() => assertValidSign('adjustment_applied', 0)).toThrow(FinancialSignError)
  })

  it('operational types do not enforce sign', () => {
    const operational: FinancialEventType[] = ['appointment_confirmed', 'appointment_completed', 'appointment_cancelled']
    for (const t of operational) {
      expect(() => assertValidSign(t, 0)).not.toThrow()
      expect(() => assertValidSign(t, 100)).not.toThrow()
      expect(() => assertValidSign(t, -100)).not.toThrow()
    }
  })

  it('FinancialSignError has descriptive message', () => {
    try {
      assertValidSign('payment_received', -50)
    } catch (e) {
      expect(e).toBeInstanceOf(FinancialSignError)
      expect((e as FinancialSignError).message).toContain('payment_received')
      expect((e as FinancialSignError).message).toContain('-50')
    }
  })
})

describe('IdempotencyGuard', () => {
  const baseEvent = {
    id: 'evt-1',
    organization_id: 'org-1',
    event_type: 'payment_received' as FinancialEventType,
    source_table: 'confirmation_logs',
    source_id: 'cl-1',
    entity_type: 'appointment' as const,
    entity_id: 'apt-1',
    occurred_by_type: 'user' as const,
    occurred_by_id: 'user-1',
    amount: 50000,
    currency: 'COP',
    status: 'settled' as const,
    version: 1,
    metadata: {},
    occurred_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  function createMockStore(events: Map<string, FinancialEvent> = new Map()) {
    return {
      findByKey: vi.fn(async (key: string) => events.get(key) ?? null),
      insert: vi.fn(async (key: string, event: Omit<FinancialEvent, 'idempotency_key'>) => {
        if (events.has(key)) throw new Error('Duplicate idempotency_key')
        const created = { ...event, idempotency_key: key } as FinancialEvent
        events.set(key, created)
        return created
      }),
    }
  }

  it('allows first-time key acquisition', async () => {
    const store = createMockStore()
    const guard = new IdempotencyGuard(store)
    const result = await guard.acquire('key-1', baseEvent)
    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects duplicate idempotency_key', async () => {
    const events = new Map<string, FinancialEvent>()
    const store = createMockStore(events)
    const guard = new IdempotencyGuard(store)

    await guard.acquire('key-1', baseEvent)
    const result = await guard.acquire('key-1', baseEvent)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Duplicate')
    expect(result.existingEvent).toBeDefined()
  })

  it('check returns isDuplicate=true for existing key', async () => {
    const events = new Map<string, FinancialEvent>([['key-1', baseEvent as FinancialEvent]])
    const guard = new IdempotencyGuard(createMockStore(events))

    const result = await guard.check('key-1')

    expect(result.isDuplicate).toBe(true)
    expect(result.existingEvent).toBe(baseEvent)
  })

  it('check returns isDuplicate=false for new key', async () => {
    const guard = new IdempotencyGuard(createMockStore())
    const result = await guard.check('new-key')
    expect(result.isDuplicate).toBe(false)
    expect(result.existingEvent).toBeUndefined()
  })

  it('handles store insert error gracefully', async () => {
    const failingStore = {
      findByKey: vi.fn(async () => null),
      insert: vi.fn(async () => { throw new Error('DB connection failed') }),
    }
    const guard = new IdempotencyGuard(failingStore)

    const result = await guard.acquire('key-1', baseEvent)

    expect(result.ok).toBe(false)
    expect(result.error).toBe('DB connection failed')
  })

  it('event replay safety: running same key twice does not duplicate', async () => {
    const events = new Map<string, FinancialEvent>()
    const store = createMockStore(events)
    const guard = new IdempotencyGuard(store)

    const first = await guard.acquire('replay-key', baseEvent)
    expect(first.ok).toBe(true)

    const second = await guard.acquire('replay-key', baseEvent)
    expect(second.ok).toBe(false)
    expect(second.existingEvent).toBeDefined()

    const check = await guard.check('replay-key')
    expect(check.isDuplicate).toBe(true)
    expect(events.size).toBe(1)
  })
})

describe('formatFinancialAmount', () => {
  it('formats positive amounts in COP', () => {
    const result = formatFinancialAmount(50000)
    expect(result).toContain('50')
    expect(result).toContain('000')
  })

  it('formats negative amounts as absolute', () => {
    const result = formatFinancialAmount(-30000)
    expect(result).not.toContain('-')
  })

  it('formats zero', () => {
    expect(formatFinancialAmount(0)).toBeDefined()
    expect(typeof formatFinancialAmount(0)).toBe('string')
  })

  it('does not produce NaN for any numeric input', () => {
    for (const amount of [0, 1, -1, 1000, -1000, 999999, 0.5]) {
      const result = formatFinancialAmount(amount)
      expect(result).toBeDefined()
      expect(result).not.toBe('NaN')
      expect(result).not.toBe('')
    }
  })
})

describe('getAmountSign', () => {
  it('returns + for positive', () => {
    expect(getAmountSign(100)).toBe('+')
  })

  it('returns - for negative', () => {
    expect(getAmountSign(-100)).toBe('-')
  })

  it('returns ± for zero', () => {
    expect(getAmountSign(0)).toBe('±')
  })
})
