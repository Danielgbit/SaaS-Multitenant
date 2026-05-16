# Replay & Idempotency

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Event Classification](08-event-classification.md)  
> **Next:** [Failure Classification](10-failure-classification.md)  
> **Index:** [README.md](README.md)

---

## Effectively-Once Processing

Prügressy does NOT guarantee "exactly-once" processing. Instead, it guarantees **effectively-once** — at-least-once delivery with idempotent processing that prevents duplicate side effects.

```
┌────────────────────────────────────────────────────────────────┐
│               EFFECTIVELY-ONCE PROCESSING                      │
│                                                                │
│  At-least-once delivery  +  Idempotent consumers              │
│  =  Effectively-once processing                                │
│                                                                │
│  An event may be delivered multiple times.                     │
│  But it will only be PROCESSED once.                           │
└────────────────────────────────────────────────────────────────┘
```

### The Three Layers

| Layer | Guarantee | Mechanism |
|---|---|---|
| **Event emission** | At-least-once | `INSERT INTO domain_events` with UNIQUE `event_id` |
| **Event delivery** | At-least-once | `pg_notify` + polling. Consumer marks `processing`. |
| **Event processing** | Effectively-once | Idempotency key on `domain_events.idempotency_key`. |

---

## Idempotency Strategy

Each event defines its idempotency strategy at the definition level:

| Strategy | Method | Use Case |
|---|---|---|
| **Natural key** | DB constraint (e.g., appointment_id unique) | State transitions that are naturally unique |
| **Combinational** | UUID v5 of key fields | Notification sends, payroll generation |
| **Time-window** | Dedup within 5-second window | Cache invalidation, calendar refresh |
| **Transaction-scoped** | DB transaction with conditional insert | Critical financial events |

### Idempotency Key Computation

```typescript
function computeIdempotencyKey(eventName: string, data: Record<string, unknown>): string {
  const hash = createHash('sha256')
    .update(eventName)
    .update(JSON.stringify(data, Object.keys(data).sort()))
    .digest('hex')
  return hash
}
```

### Idempotency Key Lifecycle

```
1. GENERATION: Computed by emitter before INSERT into domain_events
2. STORAGE: Stored in domain_events.idempotency_key column (UNIQUE constraint)
3. CHECKING: Consumer queries domain_events by idempotency_key before processing
4. CLEANUP: Keys are retained indefinitely (append-only log)
5. COLLISION: UUID v5 of (event_name + sorted payload) provides astronomically low collision risk
```

### Per-Event Idempotency Strategy

| Event | Strategy | Key Composition |
|---|---|---|
| `appointment.created` | Natural | `appointment_id` (UUID PRIMARY KEY) |
| `appointment.rescheduled` | Combinational | UUID v5 of `appointment_id + new_date + new_start_time` |
| `appointment.cancelled` | Natural | `appointment_id` (already cancelled → no-op) |
| `client.confirmed` | Combinational | UUID v5 of `appointment_id + "CLIENT_CONFIRMED"` |
| `client.confirmed_manually` | Combinational | UUID v5 of `appointment_id + "MANUAL_CONFIRM" + actor_id` |
| `service.completed` | Natural | `appointment_id` (already completed → no-op) |
| `service.completed_manually` | Combinational | UUID v5 of `appointment_id + "MANUAL_COMPLETE"` |
| `service.overdue` | Combinational | UUID v5 of `appointment_id + "OVERDUE" + date` |
| `auto_completion.triggered` | Combinational | UUID v5 of `appointment_id + "AUTO_COMPLETE" + date` |
| `payment.confirmed` | Natural | `appointment_id` (already confirmed → no-op) |
| `price.adjusted` | Combinational | UUID v5 of `appointment_id + price_after + reason` |
| `payroll.generation_requested` | Combinational | UUID v5 of `appointment_id + "PAYROLL"` |
| `notification.requested` | Combinational | UUID v5 of `appointment_id + notification_type + channel` |
| `calendar.refresh_requested` | Time-window | 5-second dedup window |

---

## Replay Safety Matrix

| Event | Replay Safe? | Risk | Safeguard |
|---|---|---|---|
| `appointment.created` | ✅ Safe | Duplicate appointment creation | Natural ID prevents duplicate; orchestrator checks if appointment already exists |
| `appointment.cancelled` | ✅ Safe | Duplicate cancellation | Orchestrator checks state; if already cancelled → no-op |
| `service.completed` | ✅ Safe | Duplicate completion mark | Orchestrator checks `confirmation_status != 'completed'` |
| `service.completed_manually` | ✅ Safe | Same as above | Same safeguard |
| `payment.confirmed` | ✅ Safe | Duplicate payment confirmation | Orchestrator checks `confirmation_status != 'confirmed'` |
| `price.adjusted` | ✅ Safe | Same price applied again | Latest price wins (last-writer-wins for pricing) |
| `payroll.generation_requested` | ✅ Safe | Duplicate commission entries | Upsert with `ignoreDuplicates` on DB constraint |
| `appointment.execution_completed` | ✅ Safe | Terminal event | Already terminal; re-emission has no effect |
| `notification.requested` | ⚠️ **Dangerous** | Duplicate WhatsApp/email sent | Mitigated by idempotency_key on `notification_queue` (UNIQUE), but channel-level dedup varies by provider |
| `calendar.refresh_requested` | ✅ Safe | Multiple cache invalidations | Time-window dedup collapses multiple into one; no domain impact |
| `state_transition.rejected` | ✅ Safe | Rejection event logging | Append-only log; duplicates are harmless |
| `service.overdue` | ✅ Safe | Duplicate overdue detection | Cron checks event already emitted for this window before emitting |
| `auto_completion.triggered` | ✅ Safe | Duplicate auto-complete | Same as overdue |

### Non-Replayable Events

| Event | Why Not Replayable | What to Do Instead |
|---|---|---|
| `whatsapp.message_dispatched` | Would send duplicate WhatsApp messages to client | Check provider-side delivery status. If not delivered, re-queue via notification system. |
| `email.message_sent` | Would send duplicate emails | Same as WhatsApp — check delivery status first. |
| Any integration event | External system may not be idempotent | Provider-specific recovery procedure. |

---

## Retry Safety

Retry safety defines whether an event can be safely re-processed without side effects.

### Safe Retries

Events that can be retried because their processing is idempotent:

```
Payroll generation       → upsert with ignoreDuplicates
State transitions        → orchestrator validates current state
Cache invalidation       → time-window dedup
Audit logging            → unique event_id constraint
Price adjustment         → last-writer-wins
```

### Unsafe Retries

Events that MUST NOT be retried without safeguards:

```
Notification dispatch    → would send duplicate messages
Email send               → would send duplicate emails
WhatsApp send            → would send duplicate WhatsApps
Webhook delivery         → would trigger duplicate webhook calls
```

### Retry Safety Table by Listener

| Listener | Max Retries | Backoff | Safe to Retry? | DLQ Threshold |
|---|---|---|---|---|
| PayrollListener | 3 | 5s → 25s → 125s | ✅ Yes (idempotent upsert) | After 3 retries |
| NotificationListener | 3 | 5min per attempt | ✅ Yes (idempotency_key) | After 3 retries |
| CacheInvalidationListener | 0 | N/A | ✅ Yes (time-window) | N/A |
| RealtimeListener | 0 | N/A | ✅ Yes (at-most-once) | N/A |
| AuditListener | 0 | N/A | ✅ Yes (unique event_id) | N/A |

---

## Event Sourcing Light (State Reconstruction)

The event log supports state reconstruction of any appointment. This is NOT full event sourcing (state is NOT derived from events), but it provides replay capability for debugging and reconciliation.

```typescript
async function reconstructAppointmentState(
  appointmentId: string,
  atTime?: Date
): Promise<AppointmentState> {
  const events = await db
    .from('domain_events')
    .select('*')
    .eq('aggregate_id', appointmentId)
    .eq('aggregate_type', 'appointment')
    .in('event_name', [
      'appointment.created',
      'appointment.cancelled',
      'service.completed',
      'service.completed_manually',
      'service.overdue',
      'auto_completion.triggered',
      'payment.confirmed',
    ])
    .lte('occurred_at', atTime?.toISOString() ?? new Date().toISOString())
    .order('occurred_at', { ascending: true })

  // Apply events sequentially to reconstruct state
  let state: AppointmentState = initialState
  
  for (const event of events) {
    state = applyTransition(state, event.event_name, event.data)
  }

  return state
}
```

**Reconstruction is used for:**
- Debugging: what state was the appointment at time X?
- Reconciliation: does event log match DB state?
- Audit: show full lifecycle in chronological order
- Recovery: fix corrupted state by replaying events

---

## Duplicate Detection Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DUPLICATE DETECTION                         │
│                                                             │
│  Layer 1: Database UNIQUE constraint                        │
│  └── idempotency_key column on domain_events table          │
│  └── Prevents duplicate INSERT of same event                │
│                                                             │
│  Layer 2: Orchestrator state check                          │
│  └── Before processing, orchestrator reads current state    │
│  └── If state already reflects transition → no-op           │
│                                                             │
│  Layer 3: Listener idempotency                              │
│  └── Payroll: upsert with ignoreDuplicates                  │
│  └── Notifications: idempotency_key UNIQUE constraint       │
│  └── Cache: time-window dedup                               │
│                                                             │
│  Result: Multiple deliveries → single processing            │
└─────────────────────────────────────────────────────────────┘
```

---

## Payroll Replay Safety Detail

Payroll is the most critical replay scenario because it involves financial calculations.

```
Scenario: PayrollListener receives payroll.generation_requested twice

First delivery:
  1. Upsert payroll_period (creates if not exists)
  2. Upsert payroll_item (creates if not exists)
  3. Upsert period_commissions with onConflict + ignoreDuplicates
  4. Recalculate totals
  5. Emit payroll.generated

Second delivery (duplicate):
  1. Upsert payroll_period (already exists → no-op)
  2. Upsert payroll_item (already exists → no-op)
  3. Upsert period_commissions (already exists → ignored)
  4. Recalculate totals (same result)
  5. Emit payroll.generated (idempotency key prevents duplicate emission)

Result: No duplicate commission entries. No financial corruption.
```

---

## Notification Replay Safety Detail

Notifications are dangerous to replay because they cost money (WhatsApp) and annoy clients.

```
Scenario: NotificationListener receives notification.requested twice

First delivery:
  1. Check automation rules
  2. Render template
  3. INSERT into notification_queue with idempotency_key
  4. UNIQUE constraint on idempotency_key prevents duplicate queue entry

Second delivery (duplicate):
  1. Check automation rules (same result)
  2. Render template (same result)
  3. INSERT into notification_queue → UNIQUE VIOLATION → silently ignored
  4. No duplicate notification sent

BUT: If the first delivery succeeded, sent the message, and the second
delivery arrives AFTER the queue item was processed, the idempotency_key
UNIQUE constraint still prevents a second queue entry.

Edge case: First delivery inserts queue item, but it fails processing.
Second delivery arrives. UNIQUE constraint blocks re-insert.
→ This is handled by marking failed queue items as retryable or dead-lettered,
   not by re-emitting notification.requested.
```

---

## Idempotency Key Lifecycle Rules

| Rule | Detail |
|---|---|
| **Generation** | Always computed by the emitter before insert |
| **Scope** | Unique per event_name + payload combination |
| **TTL** | No TTL — keys are permanent in `domain_events` table |
| **Cleanup** | No cleanup needed — keys are small, indexed, and append-only |
| **Collision handling** | `ON CONFLICT DO NOTHING` on insert — consumer checks conflict and treats as duplicate |
| **Transparency** | Key is recorded in `domain_events.metadata.idempotency_key` for debugging |

---

## Navigation

- **Previous:** [Event Classification](08-event-classification.md)
- **Next:** [Failure Classification](10-failure-classification.md)
- **Index:** [README.md](README.md)
