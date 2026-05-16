# Payroll Architecture

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Cron Architecture](12-cron-architecture.md)  
> **Next:** [Observability](14-observability.md)  
> **Index:** [README.md](README.md)

---

## PayrollOrchestrator

A separate orchestrator for payroll-specific workflows:

```
RESPONSIBILITIES:
├── Validate payroll period state
├── Calculate commissions, deductions, net pay
├── Create payroll_receipt (draft)
├── Handle period transitions: draft → finalized → paid
└── Emit payroll lifecycle events
```

---

## The Problem

Current payroll flow in `confirmService.ts` (lines 174-179):

```typescript
// Auto-agregar a nómina (fire-and-forget)
import('@/actions/payroll/addAppointmentToPayroll').then((m) =>
  m.addAppointmentToPayroll(appointmentId).catch((e) => {
    console.error('[confirmService] payroll auto-add error:', e)
  })
)
```

This is dangerous because:

| Issue | Consequence |
|---|---|
| Fire-and-forget with `.then()` | No guarantee of execution |
| `.catch()` only logs | Failure is invisible to operators |
| No idempotency check across restarts | Duplicate payroll entries on re-run |
| No ordering with notifications | Payroll may process before or after notification |
| No retry mechanism | Transient DB failure = permanent data loss |
| No dead-letter queue | Failed payroll entries are silently dropped |
| Coupled to `confirmService` | Cannot replay payroll for past appointments |

---

## New Architecture

```
PAYMENT_CONFIRMED
  ↓
AppointmentOrchestrator
  ↓ (validates transition, mutates state)
  ↓
emit: payroll.generation_requested
  ↓
┌───────────────────────────────────────────┐
│           PayrollListener                 │
│  ┌─────────────────────────────────────┐  │
│  │ 1. Read appointment (read-only)     │  │
│  │ 2. Upsert payroll_period            │  │
│  │ 3. Upsert payroll_item              │  │
│  │ 4. Upsert period_commissions        │  │
│  │ 5. Recalculate totals               │  │
│  │ 6. Emit payroll.generated           │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  On failure:                              │
│  └→ Retry (max 3, exponential backoff)   │
│  └→ emit: payroll.failed                 │
│  └→ Move to dead-letter queue            │
└───────────────────────────────────────────┘
```

---

## Retry Workflow

```typescript
class PayrollListener implements EventListener {
  async handle(event: DomainEvent): Promise<ListenerResult> {
    try {
      await this.processPayroll(event)
      await emit('payroll.generated', {
        appointment_id: event.data.appointment_id,
        period_id,
        payroll_item_id,
        services_added,
        commission_amount,
      })
      return { success: true }
    } catch (error) {
      const attempt = (event.metadata.retry_attempt ?? 0) + 1
      
      if (attempt <= this.maxRetries) {
        // Exponential backoff: 5^attempt seconds
        const delay = Math.min(5000 * Math.pow(5, attempt - 1), 300000) // max 5 min
        await emit('payroll.generation_requested', event.data, {
          ...event.metadata,
          retry_attempt: attempt,
          scheduled_for: new Date(Date.now() + delay).toISOString(),
        })
        return { success: false, retryable: true, nextRetry: delay }
      } else {
        // Dead letter
        await this.moveToDeadLetter(event, error)
        await emit('payroll.failed', {
          appointment_id: event.data.appointment_id,
          error: String(error),
          attempt_count: attempt,
        })
        return { success: false, retryable: false }
      }
    }
  }
}
```

---

## Dead-Letter Queue

```sql
CREATE TABLE payroll_dead_letter (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID NOT NULL REFERENCES domain_events(event_id),
  appointment_id    UUID NOT NULL,
  organization_id   UUID NOT NULL,
  error_message     TEXT NOT NULL,
  error_stack       TEXT,
  payload           JSONB NOT NULL,
  retry_count       INTEGER NOT NULL,
  failed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            TEXT NOT NULL DEFAULT 'pending',
    -- pending | reprocessing | resolved | ignored
  resolved_at       TIMESTAMPTZ,
  resolved_by       TEXT,       -- user_id who resolved
  resolution_note   TEXT
);
```

---

## Replay Strategy

```typescript
async function replayPayrollEvent(deadLetterId: string): Promise<void> {
  const entry = await db.from('payroll_dead_letter')
    .select('*')
    .eq('id', deadLetterId)
    .single()

  // Reset the original event and re-emit
  await db.from('domain_events')
    .update({ status: 'pending', retry_count: 0, last_error: null })
    .eq('event_id', entry.original_event_id)

  // Emit fresh event with same payload
  await emit('payroll.generation_requested', entry.payload, {
    retry_attempt: 0,
    is_replay: true,
    dead_letter_id: deadLetterId,
  })
}
```

---

## Navigation

- **Previous:** [Cron Architecture](12-cron-architecture.md)
- **Next:** [Observability](14-observability.md)
- **Index:** [README.md](README.md)
