# Failure Classification

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Replay & Idempotency](09-replay-and-idempotency.md)  
> **Next:** [Source of Truth](11-source-of-truth.md)  
> **Index:** [README.md](README.md)

---

## Failure Taxonomy

Every event processing failure in Prügressy falls into exactly one of six categories. The category determines retry strategy, DLQ behavior, and escalation path.

```
┌────────────────────────────────────────────────────────────────┐
│                      FAILURE TAXONOMY                           │
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  RETRYABLE   │    │  TRANSIENT   │    │  PERMANENT   │     │
│  │  (timeout,   │    │  (circuit,   │    │  (schema,    │     │
│  │   deadlock)  │    │   provider)  │    │   invalid)   │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  Retry 3x exp.     Circuit breaker      NO RETRY             │
│  → DLQ             → DLQ after max      → Immediate DLQ      │
│                     → Alert on open                           │
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  POISON      │    │  VALIDATION  │    │  CONCURRENCY │     │
│  │  (bad event) │    │  (business)  │    │  (lock)      │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  Quarantine           Rejection event     Retry 3x exp.     │
│  Manual review        No DLQ             → DLQ after 3      │
│  required             Audit log only      → Alert           │
└────────────────────────────────────────────────────────────────┘
```

---

## Retryable Failures

| Property | Value |
|---|---|
| **Definition** | Temporary failures that are likely to succeed on retry. |
| **Examples** | `connection timeout`, `deadlock detected`, `statement timeout`, `unique violation` (rare), `temporary provider error` |
| **Root cause** | Network issues, DB contention, brief provider unavailability |
| **Retry strategy** | Exponential backoff: 5s → 25s → 125s (3 attempts max, 155s total) |
| **DLQ behavior** | Moved to DLQ after max retries exhausted |
| **Escalation** | Log + alert after 3 failures |
| **Observability** | `domain_events.retry_count` incremented. `last_error` populated. |

```typescript
// Retryable failure detection
function isRetryable(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return (
    msg.includes('timeout') ||
    msg.includes('deadlock') ||
    msg.includes('connection') ||
    msg.includes('too many connections') ||
    msg.includes('provider unavailable')
  )
}
```

---

## Transient Failures

| Property | Value |
|---|---|
| **Definition** | Failures caused by temporary unavailability of an external dependency. |
| **Examples** | `WhatsApp provider returns 503`, `Resend email API rate limit`, `N8N webhook timeout`, `Stripe API temporary error` |
| **Root cause** | External service degradation, rate limiting, network partition |
| **Retry strategy** | Circuit breaker pattern. 5 retries with exponential backoff + jitter. Circuit opens after 5 consecutive failures. |
| **DLQ behavior** | Moved to DLQ after circuit breaker opens or max retries exceeded |
| **Escalation** | Circuit open → immediate alert. Pager duty for critical integrations (Stripe, WhatsApp). |
| **Observability** | Circuit breaker state tracked. `provider_success_rate` metric. |

```typescript
// Transient failure circuit breaker
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 30000) { // 30s cooldown
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.failures = 0
      this.state = 'closed'
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      if (this.failures >= 5) {
        this.state = 'open'
      }
      throw error
    }
  }
}
```

---

## Permanent Failures

| Property | Value |
|---|---|
| **Definition** | Failures caused by invalid data, schema violations, or logic errors. Retrying will NEVER succeed. |
| **Examples** | `Zod schema validation failure`, `foreign key violation`, `check constraint violation`, `invalid event_name`, `missing required field`, `null violation on non-nullable column` |
| **Root cause** | Bug in event emission, data corruption, migration mismatch |
| **Retry strategy** | **NO RETRY.** Immediate dead-letter. |
| **DLQ behavior** | Immediate move to DLQ with full payload and error details |
| **Escalation** | **CRITICAL.** Immediate alert. Requires developer investigation. |
| **Observability** | Full error stack captured. `domain_events.status = 'failed'` permanently. |

```typescript
// Permanent failure detection
function isPermanent(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return (
    msg.includes('violates foreign key') ||
    msg.includes('violates check constraint') ||
    msg.includes('null value') ||
    msg.includes('invalid input') ||
    msg.includes('validation failed') ||
    error instanceof ZodError
  )
}
```

---

## Poison Events

| Property | Value |
|---|---|
| **Definition** | Events that consistently fail processing with the same error, even after retries. |
| **Examples** | Same event failing 3 retries with same error, event referencing non-existent appointment, event with corrupted payload that passes schema but fails business logic |
| **Root cause** | Race condition on event creation, data race, partially migrated data, corrupted message |
| **Retry strategy** | Auto-detected after 3 consecutive retries with identical error message |
| **DLQ behavior** | Quarantine in DLQ with `status: 'pending'`. **Manual review required** before replay. |
| **Escalation** | Alert. Add to poison event dashboard. Ops team must review. |
| **Observability** | `poison_event` metric. Error hash comparison for auto-detection. |

```typescript
// Poison event detection
async function isPoisonEvent(event: DomainEvent): Promise<boolean> {
  if (event.metadata.retry_attempt < 3) return false

  const errorHistory = await db.from('domain_events')
    .select('last_error')
    .eq('correlation_id', event.correlation_id)
    .eq('event_name', event.event_name)
    .order('recorded_at', { ascending: false })
    .limit(3)

  // If all 3 errors are identical, it's a poison event
  const errors = errorHistory.map(e => e.last_error).filter(Boolean)
  return errors.length === 3 && errors.every(e => e === errors[0])
}
```

---

## Validation Failures

| Property | Value |
|---|---|
| **Definition** | Orchestrator rejects a transition because it violates business rules or state machine constraints. |
| **Examples** | `Cannot confirm already confirmed appointment`, `Cannot cancel after payment`, `Employee not assigned to this appointment`, `Cannot complete service already completed` |
| **Root cause** | Legitimate business rejection. Not a system error. |
| **Retry strategy** | **NO RETRY.** Business rules prevent this transition. |
| **DLQ behavior** | **No DLQ.** Event is marked as `failed` with rejection reason. `state_transition.rejected` is emitted. |
| **Escalation** | Recorded in audit log. No alert (expected behavior). If volume spikes, investigate. |
| **Observability** | `state_transition.rejected` event in `domain_events` table. Track rejection rate per transition type. |

```typescript
// Validation failure handling
async function handleValidationFailure(
  event: DomainEvent,
  reason: string
): Promise<void> {
  // Mark original event as failed
  await db.from('domain_events')
    .update({ status: 'failed', last_error: reason })
    .eq('event_id', event.event_id)

  // Emit rejection event for audit
  await emit('state_transition.rejected', {
    appointment_id: event.data.appointment_id,
    from_state: event.metadata.current_state,
    attempted_event: event.event_name,
    rejection_reason: reason,
  }, {
    correlation_id: event.correlation_id,
    causation_id: event.event_id,
  })
}
```

---

## Concurrency Conflicts

| Property | Value |
|---|---|
| **Definition** | Optimistic lock failure when two components attempt to transition the same appointment concurrently. |
| **Examples** | `SELECT ... FOR UPDATE` blocks second request, PG advisory lock timeout, row-level lock wait timeout |
| **Root cause** | Two events for the same appointment arrive simultaneously. Legitimate contention. |
| **Retry strategy** | Retry with backoff (3 attempts). Each retry re-reads state and re-validates transition. |
| **DLQ behavior** | Moved to DLQ after 3 retries with exponential backoff |
| **Escalation** | Log + alert if same appointment has > 3 concurrency failures in 5 minutes. Investigate workflow contention. |
| **Observability** | `concurrency_conflict` metric. Track per-appointment conflict rate. |

```typescript
// Concurrency-safe transition
async function safeTransition(event: DomainEvent): Promise<TransitionResult> {
  const appointment = await db
    .from('appointments')
    .select('*')
    .eq('id', event.data.appointment_id)
    .forUpdate()  // Acquire row lock
    .single()

  if (!appointment) {
    return { rejected: true, reason: 'Appointment not found' }
  }

  // Validate transition
  const fromState = stateKey(appointment.status, appointment.confirmation_status)
  if (!VALID_TRANSITIONS[fromState]?.has(event.event_name)) {
    return { rejected: true, reason: 'Invalid transition', isValidation: true }
  }

  // Execute atomic transition
  await db.transaction(async (tx) => {
    await tx.from('appointments')
      .update(computeTargetState(event.event_name))
      .eq('id', appointment.id)

    await tx.from('confirmation_logs').insert({ ... })
  })

  return { accepted: true }
}
```

---

## Failure Classification Summary

| Failure Type | Retry | Max Retries | DLQ | Escalation | Example |
|---|---|---|---|---|---|
| **Retryable** | ✅ Exponential backoff | 3 | ✅ After 3 retries | Log + alert | DB timeout |
| **Transient** | ✅ Circuit breaker | 5 | ✅ Circuit open | Pager duty | Provider 503 |
| **Permanent** | ❌ Never | 0 | ✅ Immediate | Critical alert | FK violation |
| **Poison** | ❌ After detection | N/A | ✅ Quarantine | Manual review | Corrupted event |
| **Validation** | ❌ Never | 0 | ❌ No DLQ | Audit only | Business rule |
| **Concurrency** | ✅ Retry + re-read | 3 | ✅ After 3 | Log + alert | Lock conflict |

---

## DLQ Routing Rules

| Event Type | DLQ Table | Retry Count | Max Age |
|---|---|---|---|
| Payroll events (`payroll.*`) | `payroll_dead_letter` | 3 | 30 days |
| Notification events (`notification.*`) | `dead_letter_notifications` | 3 | 7 days |
| State transition events (`state_transition.*`) | No DLQ | 0 | N/A |
| All other domain events | `domain_events` (status=dead_lettered) | 3 | 30 days |

---

## Escalation Paths

| Failure Type | Initial Response | Escalation (if unresolved) | SLA |
|---|---|---|---|
| **Retryable** | Automatic retry | Alert after 3 failures | 5 minutes |
| **Transient** | Circuit breaker | Pager duty after circuit opens | 15 minutes |
| **Permanent** | Immediate critical alert | Developer investigation | 1 hour |
| **Poison** | Quarantine + alert | Ops team review | 4 hours |
| **Validation** | Audit log | Investigate if rate spikes | 24 hours |
| **Concurrency** | Automatic retry | Investigate if per-appointment > 3 | 1 hour |

---

## Navigation

- **Previous:** [Replay & Idempotency](09-replay-and-idempotency.md)
- **Next:** [Source of Truth](11-source-of-truth.md)
- **Index:** [README.md](README.md)
