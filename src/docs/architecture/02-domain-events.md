# Domain Events Catalog

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Domain Overview](01-domain-overview.md)  
> **Next:** [State Ownership](03-state-ownership.md)  
> **Index:** [README.md](README.md)

---

## Event Catalog

Below is the complete catalog of domain events in the Prügressy system, organized by the business workflow they represent.

---

#### APPOINTMENT_CREATED

| Field | Value |
|---|---|
| **Event name** | `appointment.created` |
| **Business purpose** | A new appointment has been created (internal or public booking) |
| **Emitted by** | `createAppointment.ts` action, `createPublicBooking.ts` action |
| **Actor** | staff, admin, owner (internal); client (public) |
| **Source** | `internal` or `public` |
| **Payload** | `{ appointment_id, organization_id, client_id, employee_id, services: [{ service_id, price }], date, start_time, end_time, source, is_walk_in, total_price }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Natural: appointment_id is unique. Re-emitting with same appointment_id is a no-op (orchestrator checks `INSERT ... ON CONFLICT DO NOTHING`) |
| **Retry safety** | Safe to retry. If appointment already exists, orchestrator transitions to `confirm` state if not already there |

---

#### APPOINTMENT_RESCHEDULED

| Field | Value |
|---|---|
| **Event name** | `appointment.rescheduled` |
| **Business purpose** | An appointment was moved to a new date/time (drag & drop or manual reschedule) |
| **Emitted by** | Drag & drop handler, reschedule action |
| **Actor** | staff, admin, owner |
| **Source** | `internal` |
| **Payload** | `{ appointment_id, old_date, old_start_time, old_end_time, new_date, new_start_time, new_end_time, reschedule_reason? }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + new_date + new_start_time`. Duplicate detected by checking if appointment already at target time |
| **Retry safety** | Safe. If already rescheduled, orchestrator detects no-op |

---

#### APPOINTMENT_CANCELLED

| Field | Value |
|---|---|
| **Event name** | `appointment.cancelled` |
| **Business purpose** | An appointment is cancelled by client or staff |
| **Emitted by** | `cancelConfirmation.ts`, `cancelPublicBooking.ts` |
| **Actor** | client, staff, admin, owner |
| **Source** | `internal` or `public` |
| **Payload** | `{ appointment_id, cancellation_reason, cancelled_by_actor }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Natural: appointment_id is unique. If already cancelled, orchestrator declines transition |
| **Retry safety** | Safe. Orchestrator validates current state allows cancellation |

---

#### CLIENT_CONFIRMED

| Field | Value |
|---|---|
| **Event name** | `client.confirmed` |
| **Business purpose** | The client (via WhatsApp/email reply) confirmed attendance |
| **Emitted by** | Inbound notification processor (`processor.ts`) |
| **Actor** | client (system-inferred) |
| **Source** | `notification_reply` |
| **Payload** | `{ appointment_id, confirmation_channel: "whatsapp"|"email", raw_message? }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: client_phone, actor_role: "client", organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + "CLIENT_CONFIRMED"` |
| **Retry safety** | Safe. Duplicate confirms are no-ops |

---

#### CLIENT_CONFIRMED_MANUALLY

| Field | Value |
|---|---|
| **Event name** | `client.confirmed_manually` |
| **Business purpose** | Staff/Admin manually confirmed a walk-in or pending appointment |
| **Emitted by** | `markManually.ts`, reception flow |
| **Actor** | staff, admin, owner |
| **Source** | `internal` |
| **Payload** | `{ appointment_id, reason, manual_confirmation_type: "walk_in"|"override"|"reception" }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + "MANUAL_CONFIRM" + actor_id` |
| **Retry safety** | Safe. If already confirmed, orchestrator returns success without re-executing |

---

#### CLIENT_CANCELLED

| Field | Value |
|---|---|
| **Event name** | `client.cancelled` |
| **Business purpose** | Client explicitly cancelled via notification reply |
| **Emitted by** | Inbound notification processor |
| **Actor** | client |
| **Source** | `notification_reply` |
| **Payload** | `{ appointment_id, raw_message? }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: client_phone, actor_role: "client", organization_id }` |
| **Idempotency strategy** | Same as APPOINTMENT_CANCELLED — orchestrator dedupes |
| **Retry safety** | Safe |

---

#### SERVICE_COMPLETED

| Field | Value |
|---|---|
| **Event name** | `service.completed` |
| **Business purpose** | Employee marked the service as done (standard employee flow) |
| **Emitted by** | `markCompleted.ts` action |
| **Actor** | employee |
| **Source** | `employee_app` |
| **Payload** | `{ appointment_id, price_adjustment?, notes?, completed_at, services: [{ service_id, price_override? }] }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role: "employee", organization_id }` |
| **Idempotency strategy** | Natural: appointment_id. Orchestrator checks `confirmation_status != 'scheduled'` to prevent double-mark |
| **Retry safety** | Safe. If already completed, orchestrator returns success |

---

#### SERVICE_COMPLETED_MANUALLY

| Field | Value |
|---|---|
| **Event name** | `service.completed_manually` |
| **Business purpose** | Admin/Staff bypassed employee marking and manually set service as completed |
| **Emitted by** | `markManually.ts` action |
| **Actor** | staff, admin, owner |
| **Source** | `internal` |
| **Payload** | `{ appointment_id, reason, manual_completion_type: "override"|"reception" }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + "MANUAL_COMPLETE"` |
| **Retry safety** | Safe |

---

#### SERVICE_OVERDUE

| Field | Value |
|---|---|
| **Event name** | `service.overdue` |
| **Business purpose** | 60 minutes elapsed since service end time without employee marking completed |
| **Emitted by** | Cron detector (`check-reminders`) |
| **Actor** | system |
| **Source** | `cron_detector` |
| **Payload** | `{ appointment_id, elapsed_minutes: 60+, end_time }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "system", organization_id }` |
| **Idempotency strategy** | UUID v5 of `appointment_id + "OVERDUE" + date`. Cron detector fetches unprocessed items only |
| **Retry safety** | Safe. If already in `needs_review`, orchestrator ignores |

---

#### AUTO_COMPLETION_TRIGGERED

| Field | Value |
|---|---|
| **Event name** | `auto_completion.triggered` |
| **Business purpose** | 120 minutes elapsed in `needs_review` state — system auto-completes |
| **Emitted by** | Cron detector (`check-reminders`) |
| **Actor** | system |
| **Source** | `cron_detector` |
| **Payload** | `{ appointment_id, elapsed_minutes, end_time }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "system", organization_id }` |
| **Idempotency strategy** | Same as SERVICE_OVERDUE. Cron tracks `last_processed_event_id` per appointment |
| **Retry safety** | Safe. Orchestrator validates state allows completion |

---

#### PAYMENT_CONFIRMED

| Field | Value |
|---|---|
| **Event name** | `payment.confirmed` |
| **Business purpose** | Reception/admin confirmed payment was received for the appointment |
| **Emitted by** | `confirmService.ts` action |
| **Actor** | staff, admin, owner |
| **Source** | `internal` |
| **Payload** | `{ appointment_id, payment_method, amount, price_before, price_after, notes? }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Natural: appointment_id. Orchestrator checks `confirmation_status != 'confirmed'` |
| **Retry safety** | Critically NOT safe without orchestration. Orchestrator must validate transition BEFORE emitting PAYROLL_GENERATION_REQUESTED |

---

#### PRICE_ADJUSTED

| Field | Value |
|---|---|
| **Event name** | `price.adjusted` |
| **Business purpose** | Staff/Admin adjusted the price of an appointment before confirmation |
| **Emitted by** | `adjustPrice.ts` action |
| **Actor** | staff, admin, owner |
| **Source** | `internal` |
| **Payload** | `{ appointment_id, price_before, price_after, reason }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + price_after + reason` allows same adjustment multiple times if needed |
| **Retry safety** | Safe. Orchestrator applies latest price |

---

#### PAYROLL_GENERATION_REQUESTED

| Field | Value |
|---|---|
| **Event name** | `payroll.generation_requested` |
| **Business purpose** | A confirmed appointment should be added to payroll calculations |
| **Emitted by** | Orchestrator (after PAYMENT_CONFIRMED transition validated) |
| **Actor** | system (orchestrator) |
| **Source** | `orchestrator` |
| **Payload** | `{ appointment_id, organization_id, employee_id, period: "YYYY-MM", services: [{ service_id, price, commission_rate }] }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "orchestrator", organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + "PAYROLL"`. PayrollListener checks if `period_commissions` already has this appointment_id |
| **Retry safety** | MUST be retry-safe. PayrollListener uses upsert with `ignoreDuplicates` |

---

#### PAYROLL_GENERATED

| Field | Value |
|---|---|
| **Event name** | `payroll.generated` |
| **Business purpose** | Payroll entry was successfully created for an appointment |
| **Emitted by** | PayrollListener (after successful DB insert) |
| **Actor** | system (listener) |
| **Source** | `payroll_listener` |
| **Payload** | `{ appointment_id, period_id, payroll_item_id, services_added, commission_amount, period }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "payroll_listener", organization_id }` |
| **Idempotency strategy** | Natural: unique per appointment+period combination |
| **Retry safety** | Safe. Used for audit trailing only |

---

#### PAYROLL_FAILED

| Field | Value |
|---|---|
| **Event name** | `payroll.failed` |
| **Business purpose** | Payroll generation failed for an appointment |

| **Emitted by** | PayrollListener (after retries exhausted) |
| **Actor** | system (listener) |
| **Source** | `payroll_listener` |
| **Payload** | `{ appointment_id, error, attempt_count, next_retry_at? }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "payroll_listener", organization_id }` |
| **Idempotency strategy** | Each failure is a new event with unique UUID |
| **Retry safety** | Event itself is the failure report; no retry needed |

---

#### NOTIFICATION_REQUESTED

| Field | Value |
|---|---|
| **Event name** | `notification.requested` |
| **Business purpose** | A notification should be sent (WhatsApp, email, or in-app) |
| **Emitted by** | Orchestrator (after state transitions), Cron (for reminders) |
| **Actor** | system |
| **Source** | `orchestrator` or `cron_detector` |
| **Payload** | `{ notification_type: AutomationTrigger, appointment_id, channel?: "whatsapp"|"email"|"in_app" }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "orchestrator", organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `appointment_id + notification_type + hash(channel)`. NotificationListener uses `idempotency_key` on `notification_queue` |
| **Retry safety** | Safe. NotificationListener dedupes by idempotency_key |

---

#### CALENDAR_REFRESH_REQUESTED

| Field | Value |
|---|---|
| **Event name** | `calendar.refresh_requested` |
| **Business purpose** | The calendar UI should be invalidated for an organization |
| **Emitted by** | Orchestrator (after any appointment state change) |
| **Actor** | system (orchestrator) |
| **Source** | `orchestrator` |
| **Payload** | `{ organization_id, affected_dates: string[], affected_employee_ids: string[] }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "orchestrator", organization_id }` |
| **Idempotency strategy** | Time-based: dedup within 5-second window. CacheInvalidationListener batches requests |
| **Retry safety** | Safe. Cache invalidation is idempotent by nature |

---

#### APPOINTMENT_EXECUTION_COMPLETED

| Field | Value |
|---|---|
| **Event name** | `appointment.execution_completed` |
| **Business purpose** | Full lifecycle of an appointment is complete (paid, payroll done, notifications sent) |
| **Emitted by** | Orchestrator (terminal state reached) |
| **Actor** | system (orchestrator) |
| **Source** | `orchestrator` |
| **Payload** | `{ appointment_id, final_status: "completed"|"cancelled", total_duration_seconds }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "orchestrator", organization_id }` |
| **Idempotency strategy** | Natural: one per appointment lifecycle |
| **Retry safety** | Safe. Terminal event with no further transitions |

---

#### STATE_TRANSITION_REJECTED

| Field | Value |
|---|---|
| **Event name** | `state_transition.rejected` |
| **Business purpose** | An illegal state transition was attempted |
| **Emitted by** | Orchestrator (validation failure) |
| **Actor** | system (orchestrator) |
| **Source** | `orchestrator` |
| **Payload** | `{ appointment_id, from_state, to_state, attempted_event, rejection_reason }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "orchestrator", organization_id }` |
| **Idempotency strategy** | Each rejection is unique |
| **Retry safety** | Event is diagnostic; no retry needed |

---

#### PAYROLL_RECEIPT_REQUESTED

| Field | Value |
|---|---|
| **Event name** | `payroll.receipt_requested` |
| **Business purpose** | A payroll receipt draft should be auto-generated (end of period or manual trigger) |
| **Emitted by** | Cron (end-of-period detector), Manual action |
| **Actor** | system or admin |
| **Source** | `cron_detector` or `internal` |
| **Payload** | `{ organization_id, employee_id, period_start, period_end }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Combinational: UUID v5 of `employee_id + period_start + period_end`. PayrollListener checks existing draft |
| **Retry safety** | Safe. Receipt generation is idempotent (replaces draft) |

---

#### NOTIFICATION_DELIVERY_CONFIRMED

| Field | Value |
|---|---|
| **Event name** | `notification.delivery_confirmed` |
| **Business purpose** | A notification was successfully delivered/read |
| **Emitted by** | Webhook handler (WhatsApp status callback) |
| **Actor** | system (provider) |
| **Source** | `webhook` |
| **Payload** | `{ notification_queue_id, provider_message_id, status: "delivered"|"read"|"failed", timestamp }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id: "system", actor_role: "provider", organization_id }` |
| **Idempotency strategy** | Natural: provider_message_id is unique per provider |
| **Retry safety** | Safe. Status updates are idempotent |

---

#### PAYROLL_PERIOD_CLOSED

| Field | Value |
|---|---|
| **Event name** | `payroll.period_closed` |
| **Business purpose** | A payroll period was closed (draft → finalized) |
| **Emitted by** | `managePayrollPeriod.ts` action |
| **Actor** | admin, owner |
| **Source** | `internal` |
| **Payload** | `{ period_id, organization_id, employee_ids: string[], total_gross_pay, total_net_pay }` |
| **Required metadata** | `{ correlation_id, causation_id, actor_id, actor_role, organization_id }` |
| **Idempotency strategy** | Natural: period_id. Orchestrator checks status transition (draft → finalized) |
| **Retry safety** | Safe. Once finalized, second close is rejected |

---

## Event Registration Pattern

Every event in the system MUST be registered in a central `EventRegistry` that defines:

```typescript
interface EventDefinition {
  name: DomainEventName
  version: number
  description: string
  emittedBy: string[]       // source identifiers
  subscribedBy: string[]    // listener identifiers
  schema: Record<string, unknown>  // Zod schema
  idempotencyKeySource: string[]   // payload fields used for idempotency
  retrySafe: boolean
  maxRetries: number
}
```

---

## Event Payload Design

### Standard Envelope Structure

Every event in the system MUST conform to the following envelope:

```typescript
interface DomainEvent<T = Record<string, unknown>> {
  // ── Identity (immutable) ──────────────────────────────
  event_id: string              // UUID v4 - globally unique

  // ── Tracing ───────────────────────────────────────────
  correlation_id: string        // UUID - same for entire business flow
  causation_id: string          // UUID - the event_id that caused this event

  // ── Routing ───────────────────────────────────────────
  event_name: string            // e.g. "payment.confirmed"
  event_version: number         // starts at 1, incremented on schema change

  // ── Domain Identity ───────────────────────────────────
  organization_id: string
  appointment_id: string | null // nullable for non-appointment events
  aggregate_id: string          // the entity ID (appointment_id, period_id, etc.)
  aggregate_type: string        // "appointment" | "payroll_period" | etc.

  // ── Actor ─────────────────────────────────────────────
  actor_id: string              // user_id, "system", or client identifier
  actor_role: DomainActorRole   // "owner" | "admin" | "staff" | "employee" | "client" | "system" | "orchestrator"
  actor_source: string          // "web_app" | "employee_app" | "public_booking" | "cron" | "webhook" | "orchestrator"

  // ── Timing ────────────────────────────────────────────
  occurred_at: string           // ISO 8601 - when the event happened
  recorded_at: string           // ISO 8601 - when the event was recorded

  // ── Business Data ─────────────────────────────────────
  data: T

  // ── Metadata (extensible) ─────────────────────────────
  metadata: {
    request_id?: string         // HTTP request ID for traceability
    user_agent?: string         // client UA string
    ip_address?: string         // source IP (for audit)
    idempotency_key?: string    // for dedup (computed from data)
    retry_attempt?: number      // 0-based retry count
    source_event_id?: string    // original event causing retry
  }
}
```

### Traceability Chain

The traceability model uses three IDs:

```
correlation_id  ───  Tracks the entire business transaction across all events
                         │
causation_id    ───  Links each event to the specific event that caused it
                         │
event_id        ───  Uniquely identifies this specific event instance
```

**Example trace for a complete appointment lifecycle:**

```
correlation_id: a1b2c3d4-...  (same across all events)

event_id: e1  ←  causation_id: null     (APPOINTMENT_CREATED)
event_id: e2  ←  causation_id: e1       (NOTIFICATION_REQUESTED - confirmation)
event_id: e3  ←  causation_id: e1       (SERVICE_COMPLETED)
event_id: e4  ←  causation_id: e3       (PAYMENT_CONFIRMED)
event_id: e5  ←  causation_id: e4       (PAYROLL_GENERATION_REQUESTED)
event_id: e6  ←  causation_id: e4       (NOTIFICATION_REQUESTED - receipt)
event_id: e7  ←  causation_id: e5       (PAYROLL_GENERATED)
event_id: e8  ←  causation_id: e4       (APPOINTMENT_EXECUTION_COMPLETED)
```

### Versioning Strategy

| Version Change | When | Consumer Impact |
|---|---|---|
| Major | Breaking schema change | New consumer must handle both versions |
| Minor | Backward-compatible field addition | Old consumers ignore unknown fields |
| Patch | Bug fix to event logic | No schema change |

Events are stored with their version number. Consumers declare which versions they support.

### Database Schema for Events

```sql
CREATE TABLE domain_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL UNIQUE,
  event_name          TEXT NOT NULL,
  event_version       INTEGER NOT NULL DEFAULT 1,
  correlation_id      UUID NOT NULL,
  causation_id        UUID,
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  aggregate_id        TEXT NOT NULL,
  aggregate_type      TEXT NOT NULL,
  actor_id            TEXT NOT NULL,
  actor_role          TEXT NOT NULL,
  actor_source        TEXT NOT NULL,
  occurred_at         TIMESTAMPTZ NOT NULL,
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data                JSONB NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',
  idempotency_key     TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending',
    -- pending | processing | completed | failed | dead_lettered
  processed_at        TIMESTAMPTZ,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  last_error          TEXT,
  CONSTRAINT valid_actor_role CHECK (
    actor_role IN ('owner','admin','staff','employee','client','system','orchestrator')
  )
);

-- Critical indexes
CREATE INDEX idx_domain_events_org ON domain_events(organization_id, recorded_at DESC);
CREATE INDEX idx_domain_events_appointment ON domain_events(aggregate_id, aggregate_type);
CREATE INDEX idx_domain_events_correlation ON domain_events(correlation_id);
CREATE INDEX idx_domain_events_status ON domain_events(status, recorded_at)
  WHERE status = 'pending';
CREATE INDEX idx_domain_events_idempotency ON domain_events(idempotency_key);
CREATE INDEX idx_domain_events_event_name ON domain_events(event_name, recorded_at DESC);
```

---

## Navigation

- **Previous:** [Domain Overview](01-domain-overview.md)
- **Next:** [State Ownership](03-state-ownership.md)
- **Index:** [README.md](README.md)
