import type { FinancialEvent } from '@/types/financial'

/**
 * IdempotencyGuard — DB-level uniqueness via idempotency_key.
 *
 * Atomicity is delegated to the UNIQUE constraint on financial_events.idempotency_key.
 * No in-memory locks, no cache locks, no process locks.
 * The only reliable lock for append-only financial events is the database constraint itself.
 *
 * This guard exists to:
 * 1. Check idempotency before inserting (optimistic)
 * 2. Provide a structured way to acquire the key (insert-then-catch)
 * 3. Return existing event on duplicate
 */
export interface IdempotencyCheckResult {
  isDuplicate: boolean
  existingEvent?: FinancialEvent
}

export interface IdempotencyAcquireResult {
  ok: boolean
  existingEvent?: FinancialEvent
  error?: string
}

export interface IdempotencyStore {
  findByKey(key: string): Promise<FinancialEvent | null>
  insert(key: string, event: Omit<FinancialEvent, 'idempotency_key'>): Promise<FinancialEvent>
}

export class IdempotencyGuard {
  constructor(private store: IdempotencyStore) {}

  async check(key: string): Promise<IdempotencyCheckResult> {
    const existing = await this.store.findByKey(key)
    return {
      isDuplicate: existing !== null,
      existingEvent: existing ?? undefined,
    }
  }

  async acquire(key: string, event: Omit<FinancialEvent, 'idempotency_key'>): Promise<IdempotencyAcquireResult> {
    const { isDuplicate, existingEvent } = await this.check(key)
    if (isDuplicate) {
      return { ok: false, existingEvent, error: `Duplicate idempotency_key: ${key}` }
    }
    try {
      const created = await this.store.insert(key, event)
      return { ok: true, existingEvent: created }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error acquiring idempotency key',
      }
    }
  }
}
