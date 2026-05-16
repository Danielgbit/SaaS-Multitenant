# Prügressy — Formal Domain Event Architecture

> **Version:** 1.0.0  
> **Status:** LEGACY — See Architecture Handbook  
> **Author:** Staff+ Backend Architect  
> **Date:** May 2026  

> ⚠️ **This document has been split into a modular Architecture Handbook.**
> See [`/docs/architecture/README.md`](architecture/README.md) for the current index and recommended reading paths.
> This file is kept for legacy reference only. All new development should reference the handbook.  

---

## Table of Contents

1. [Event-Driven Architecture Analysis](#section-1--event-driven-architecture-analysis)
2. [Core Domain Events](#section-2--core-domain-events)
3. [Event Taxonomy](#section-3--event-taxonomy)
4. [Event Payload Design](#section-4--event-payload-design)
5. [Event Flow Maps](#section-5--event-flow-maps)
6. [Orchestrator Design](#section-6--orchestrator-design)
7. [Listener Architecture](#section-7--listener-architecture)
8. [Cron Event Architecture](#section-8--cron-event-architecture)
9. [Payroll Event Decoupling](#section-9--payroll-event-decoupling)
10. [Observability & Audit Architecture](#section-10--observability--audit-architecture)
11. [Migration Strategy](#section-11--migration-strategy)
12. [Recommended Folder Structure](#section-12--recommended-folder-structure)

---

## SECTION 1 — Event-Driven Architecture Analysis

### 1.1 Why the Current Architecture Is Dangerous

The current Prügressy architecture violates the **Single Responsibility Principle** at every layer. Business logic is scattered across four concerns with no clear boundaries:

| Concern | Where It Lives | The Problem |
|---------|---------------|-------------|
| State mutation | Actions, Cron jobs, API routes | No single source of truth for transitions |
| Side effects | Actions (fire-and-forget payroll) | Silent failures, no retries, no observability |
| Notifications | Actions, Cron jobs, Orchestrator | Coupled to business logic, duplicated conditions |
| Cache invalidation | Spread across 5+ calls per action | Brittle, misses edge cases, duplicated try/catch |

**Concrete evidence from the codebase:**

1. **`confirmService.ts` lines 174-179:** Payroll is fire-and-forget via dynamic import. If `addAppointmentToPayroll` fails, the appointment is already marked as confirmed, payment was registered, but payroll entry is silently lost. The system loses revenue data with zero audit trail.

2. **`runCheckReminders.ts` lines 129-132 and 187-194:** The cron job directly mutates `confirmation_status` and `status` on appointments. This bypasses all validation, authorization, and event logging. A cron bug could corrupt the entire appointment state.

3. **`markCompleted.ts` lines 126-169:** A single action performs: state mutation + confirmation log + notification creation + cache invalidation. Each of these is a separate concern with different failure modes, but they are coupled into a single transaction with no rollback strategy.

4. **`markManually.ts` lines 103-165:** Same pattern — mutates state, creates appointment_confirmations, sends notifications, invalidates cache. Duplicated logic from `markCompleted.ts` with slight variations that will inevitably diverge.

5. **`adjustPrice.ts`:** Creates log, mutates state, invalidates cache. No event emitted. If a price adjustment affects payroll, there is no mechanism to recalculate.

### 1.2 Why Side Effects Are Coupled

Every Server Action in Prügressy follows this pattern:

```
validate input → authorize user → mutate DB → log → notify → invalidate cache → fire-and-forget payroll
```

This is problematic because:

- **No isolation:** A failed notification blocks the state mutation? No — but the error is silently caught (`console.warn`). This means partial failures are invisible.
- **No ordering guarantees:** Payroll is kicked off via `import(...).then(...)` with no ordering relative to other side effects.
- **No idempotency:** If `confirmService` is called twice (UI double-click), the payroll insertion uses `upsert` with `ignoreDuplicates`, but notifications and logs are duplicated.
- **No replay capability:** If payroll needs to be regenerated, there is no event history to replay. The only option is to manually recalculate.

### 1.3 Why Cron Mutations Are Problematic

The `runCheckReminders.ts` cron performs three distinct mutations:

1. **Reminder phase:** Inserts `notifications` directly — no event, no orchestrator validation.
2. **Alert phase:** Mutates `confirmation_status` from `scheduled` to `needs_review` — bypasses transition validation.
3. **Auto-complete phase:** Mutates `confirmation_status` to `completed` and `status` to `completed` — bypasses all business rules.

Each of these should be an **event emission** that triggers the orchestrator to validate and execute the transition. Currently:

- There is no way to audit that the cron caused a state change (the `confirmation_logs` insert in auto-complete is inconsistent — reminders and alerts have no logs).
- There is no way to prevent double-processing (the cron has no distributed locking).
- There is no dead-letter handling if a mutation fails halfway through a batch.

### 1.4 Why Event-Driven Architecture Fits This Domain

Prügressy operates in a domain that is **inherently event-driven**:

| Business Event | Natural Occurrence |
|---------------|-------------------|
| Client books | Triggered once per appointment |
| Employee completes service | Triggered once per service completion |
| Payment confirmed | Triggered once per payment |
| 60 minutes elapsed | Time-triggered boundary |
| 120 minutes elapsed | Time-triggered boundary |
| Payroll period ends | Time-triggered boundary |

The domain **already thinks in events** — the problem is the codebase does not formalize them. Every "trigger" in the business logic is an event waiting to be modeled.

Benefits of formalizing:

| Benefit | Why It Matters for Prügressy |
|---------|------------------------------|
| **Deterministic state transitions** | Every state change is validated by the orchestrator, not by the action |
| **Observable workflows** | Each appointment lifecycle can be replayed from the event log |
| **Isolated failures** | Payroll failure does not affect payment confirmation |
| **Resilient side effects** | Notifications, payroll, cache invalidation become retryable listeners |
| **Audit completeness** | Every state change has a corresponding event with full metadata |
| **Safe timeouts** | Cron emits events; orchestrator validates transitions |
| **Manual override traceability** | Overrides become named events with actor, reason, and timestamp |

### 1.5 How Workflows Should Be Orchestrated

The new architecture follows a strict **three-layer model**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         ACTIONS                                 │
│  (User-facing Server Actions)                                   │
│  Responsibilities: validate input, authorize, emit event        │
│  DO NOT: mutate state directly, execute side effects            │
├─────────────────────────────────────────────────────────────────┤
│                      ORCHESTRATOR                               │
│  (AppointmentOrchestrator)                                      │
│  Responsibilities: validate transitions, emit follow-up events  │
│  DO NOT: execute side effects, send notifications               │
├─────────────────────────────────────────────────────────────────┤
│                       LISTENERS                                 │
│  (PayrollListener, NotificationListener, AuditListener, etc.)   │
│  Responsibilities: execute side effects, handle retries         │
│  DO NOT: mutate domain state, validate business rules           │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**

```
User Action
  ↓ emit
Domain Event
  ↓ persist
Event Store (DB)
  ↓ fan-out
Orchestrator  →  validates transition  →  emits result event
  ↓
Listeners  →  execute side effects  →  handle failures independently
```

Each layer has explicit responsibilities and strict boundaries:

| Layer | Reads State | Writes State | Emits Events | Has Retries |
|-------|-------------|--------------|--------------|-------------|
| Action | Yes (read) | No | Yes | No |
| Orchestrator | Yes (validate) | Yes (transition) | Yes | Yes |
| Listener | Yes (read) | No (writes own data) | No | Yes |

---

## SECTION 2 — Core Domain Events

### 2.1 Event Catalog

Below is the complete catalog of domain events in the Prügressy system, organized by the business workflow they represent.

---

#### APPOINTMENT_CREATED

| Field | Value |
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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
|-------|-------|
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

### 2.2 Event Registration Pattern

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

## SECTION 3 — Event Taxonomy

### 3.1 Event Categories

Events are categorized into ten groups with strict boundaries:

```
DOMAIN EVENTS
├── BOOKING EVENTS
│   ├── appointment.created
│   ├── appointment.rescheduled
│   └── appointment.cancelled
│
├── CONFIRMATION EVENTS
│   ├── client.confirmed
│   ├── client.confirmed_manually
│   └── client.cancelled
│
├── EXECUTION EVENTS
│   ├── service.completed
│   ├── service.completed_manually
│   ├── service.overdue
│   └── auto_completion.triggered
│
├── PAYMENT EVENTS
│   ├── payment.confirmed
│   └── price.adjusted
│
├── PAYROLL EVENTS
│   ├── payroll.generation_requested
│   ├── payroll.generated
│   ├── payroll.failed
│   ├── payroll.receipt_requested
│   └── payroll.period_closed
│
├── NOTIFICATION EVENTS
│   ├── notification.requested
│   └── notification.delivery_confirmed
│
├── INFRASTRUCTURE EVENTS
│   ├── calendar.refresh_requested
│   └── state_transition.rejected
│
├── SYSTEM EVENTS
│   ├── service.overdue
│   ├── auto_completion.triggered
│   └── payroll.generation_requested
│
├── OVERRIDE EVENTS
│   ├── client.confirmed_manually
│   └── service.completed_manually
│
└── LIFECYCLE EVENTS
    └── appointment.execution_completed
```

### 3.2 Category Responsibilities

| Category | Who Emits | Who Consumes | State Mutations | Persistence Required |
|----------|-----------|--------------|-----------------|---------------------|
| **Booking Events** | User actions | Orchestrator, NotificationListener | Yes (appointment created) | Yes |
| **Confirmation Events** | Inbound processor, Manual actions | Orchestrator | Yes (confirmation_status) | Yes |
| **Execution Events** | Employee actions, Manual actions, Cron | Orchestrator | Yes (status, confirmation_status) | Yes |
| **Payment Events** | Staff actions | Orchestrator, PayrollListener | Yes (payment_method, confirmed) | Yes |
| **Payroll Events** | Orchestrator, PayrollListener | PayrollListener, AuditListener | Yes (payroll tables) | Yes |
| **Notification Events** | Orchestrator, Cron | NotificationListener | No | Yes (queue table) |
| **Infrastructure Events** | Orchestrator | CacheInvalidationListener | No | No (RPC/event bus) |
| **System Events** | Cron, Orchestrator | Orchestrator | Yes (cron-triggered transitions) | Yes |
| **Override Events** | Manual actions | Orchestrator | Yes (explicit overrides) | Yes |
| **Lifecycle Events** | Orchestrator | AuditListener | Terminal signal | Yes |

### 3.3 Event Boundaries

**BOOKING EVENTS** — Only deal with appointment creation and scheduling. Never trigger payroll or notifications directly.

**CONFIRMATION EVENTS** — Deal with client-side attendance confirmation. Never trigger state transitions on their own (orchestrator validates).

**EXECUTION EVENTS** — Deal with service delivery marking. Carry price adjustment data. Never trigger payment processing.

**PAYMENT EVENTS** — Deal with financial settlement. Trigger payroll generation via orchestrator.

**PAYROLL EVENTS** — Deal with payroll computation only. Never deal with appointment state.

**NOTIFICATION EVENTS** — Deal with outbound communication only. Never deal with domain state.

**OVERRIDE EVENTS** — Formalize manual interventions. Always carry `reason` and `manual_override_type`.

---

## SECTION 4 — Event Payload Design

### 4.1 Standard Envelope Structure

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

### 4.2 Traceability Chain

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

### 4.3 Versioning Strategy

| Version Change | When | Consumer Impact |
|---------------|------|-----------------|
| Major | Breaking schema change | New consumer must handle both versions |
| Minor | Backward-compatible field addition | Old consumers ignore unknown fields |
| Patch | Bug fix to event logic | No schema change |

Events are stored with their version number. Consumers declare which versions they support.

### 4.4 Idempotency Strategy

Each event defines its idempotency strategy at the definition level:

| Strategy | Method | Use Case |
|----------|--------|----------|
| **Natural key** | DB constraint (e.g., appointment_id unique) | State transitions that are naturally unique |
| **Combinational** | UUID v5 of key fields | Notification sends, payroll generation |
| **Time-window** | Dedup within 5-second window | Cache invalidation, calendar refresh |
| **Transaction-scoped** | DB transaction with conditional insert | Critical financial events |

The `idempotency_key` in metadata is computed as:

```typescript
function computeIdempotencyKey(eventName: string, data: Record<string, unknown>): string {
  const hash = createHash('sha256')
    .update(eventName)
    .update(JSON.stringify(data, Object.keys(data).sort()))
    .digest('hex')
  return hash
}
```

### 4.5 Database Schema for Events

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

## SECTION 5 — Event Flow Maps

### 5.1 Flow A: Client Confirmation (Automatic)

```
INBOUND NOTIFICATION PROCESSOR
  └── Client replies "confirmar" via WhatsApp
      ↓
  emit: client.confirmed
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate current state           │
│     - appointment exists             │
│     - status is 'confirmed'          │
│     - confirmation_status ≠ 'confirmed'  │
│  2. Transition: confirmation_status → 'confirmed' │
│  3. Log: confirmation_logs (action: 'confirmed_by_client') │
│  4. Emit outgoing events             │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested
    type: "appointment_confirmed"
    channel: "in_app" (staff notification)
      ↓
  [NotificationListener]
    → queue message
    → process via channel adapter
```

### 5.2 Flow B: Manual Client Confirmation (Override)

```
STAFF ACTION: markManually.ts
  └── Staff clicks "Confirmar manualmente"
      ↓
  validate: user role ∈ {owner, admin, staff}
  validate: appointment.confirmation_status ≠ 'confirmed'
      ↓
  emit: client.confirmed_manually
    data: { appointment_id, reason, manual_confirmation_type: "override" }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate transition: scheduled → completed │
│  2. Transition:                      │
│     - confirmation_status: 'completed'          │
│     - status: 'completed'                       │
│     - completed_at: now                         │
│  3. Log: confirmation_logs           │
│     action: 'manually_set'           │
│     performed_by_role: 'assistant'   │
│  4. Emit outgoing events             │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested
    type: "service_ready"
    channel: "in_app" (to staff)
      ↓
  [NotificationListener]
```

### 5.3 Flow C: Employee Marks Completed

```
EMPLOYEE ACTION: markCompleted.ts
  └── Employee clicks "Listo" in their app
      ↓
  validate: user is assigned employee for appointment
  validate: appointment.confirmation_status ∈ {scheduled}
  calculate: price with optional adjustment
      ↓
  emit: service.completed
    data: {
      appointment_id,
      price_adjustment,
      notes,
      completed_at: now,
      services: [{ service_id, price }]
    }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate transition: scheduled → completed  │
│  2. Transition:                      │
│     - confirmation_status: 'completed'          │
│     - status: 'completed'                       │
│     - completed_at: now                         │
│     - completed_by: user.id                     │
│     - price_adjustment: computed price          │
│  3. Log: confirmation_logs           │
│     action: 'created'                │
│     performed_by_role: 'employee'    │
│  4. Emit outgoing events             │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested        ──────→  [NotificationListener]
    type: "service_ready"                        → Send in-app notifications to staff
    channel: ["in_app"]                          → Check automation rules for WhatsApp
      ↓
  emit: calendar.refresh_requested    ──────→  [CacheInvalidationListener]
    affected_dates: [today]                      → revalidateTag("confirmations-{orgId}")
                                                 → revalidateTag("pending-{orgId}")
```

### 5.4 Flow D: Manual Service Completion (Override)

```
STAFF ACTION: markManually.ts
  └── Staff marks appointment as completed directly
      ↓
  validate: user role ∈ {owner, admin, staff}
  validate: appointment.confirmation_status ≠ 'confirmed'
      ↓
  emit: service.completed_manually
    data: { appointment_id, reason, manual_completion_type }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  (Identical transition to Flow C)   │
│  1. Validate: scheduled → completed  │
│  2. Transition: same state change   │
│  3. Log: confirmation_logs           │
│     action: 'manually_set'           │
│     notes: "Marca manual: {reason}"  │
│  4. Emit outgoing events            │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested        ──────→  [NotificationListener]
  emit: calendar.refresh_requested    ──────→  [CacheInvalidationListener]
```

**Note:** Flows C and D have IDENTICAL orchestrator behavior. The difference is tracked ONLY via the event name, actor_role, and audit log. This is by design — the orchestrator enforces the same state machine regardless of the actor, while the event taxonomy preserves the distinction for auditability.

### 5.5 Flow E: Payment Confirmation

```
STAFF ACTION: confirmService.ts
  └── Reception selects payment method and confirms
      ↓
  validate: user role ∈ {owner, admin, staff}
  validate: appointment.confirmation_status = 'completed' (or 'needs_review')
  validate: appointment.confirmation_status ≠ 'confirmed'
  calculate: price = Σ(service_price, overrides, adjustments)
      ↓
  emit: payment.confirmed
    data: {
      appointment_id,
      payment_method,   // one of 8 methods
      price_before,
      price_after,
      notes?
    }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate transition:              │
│     confirmation_status: completed → confirmed │
│     status: completed → completed     │
│  2. Transition:                      │
│     - confirmation_status: 'confirmed'          │
│     - confirmed_at: now                         │
│     - confirmed_by: user.id                     │
│     - payment_method: selected                  │
│  3. Log: confirmation_logs           │
│     action: 'confirmed'              │
│     performed_by_role: 'assistant'   │
│  4. Emit outgoing events             │
└──────────────────────────────────────┘
      ↓
  emit: payroll.generation_requested   ──────→  [PayrollListener]
    data: { appointment_id, ... }                → Add to payroll period
      ↓
  emit: notification.requested         ──────→  [NotificationListener]
    type: "confirmation_sent"                    → Notify employee payment was received
    channel: "in_app"
      ↓
  emit: calendar.refresh_requested     ──────→  [CacheInvalidationListener]
      ↓
  emit: appointment.execution_completed        ──────→  [AuditListener]
```

### 5.6 Flow F: Auto-Complete Cron Flow

```
CRON DETECTOR (every 3 min)
  └── Phase 1: Detect appointments > 60 min past end_time
      where confirmation_status = 'scheduled'
      ↓
  emit: service.overdue
    data: { appointment_id, elapsed_minutes, end_time }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate: scheduled → needs_review          │
│  2. Transition:                      │
│     - confirmation_status: 'needs_review'       │
│  3. Log: confirmation_logs? (optional)          │
│  4. Emit notifications               │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested         ──────→  [NotificationListener]
    type: "unmarked_alert"                       → Notify staff about unmarked appointment
    channel: "in_app"
    target: [owner, admin, staff]
      ↓
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (separate cron cycle) ─ ─ ─

CRON DETECTOR (next cycle)
  └── Phase 2: Detect appointments > 120 min past end_time
      where confirmation_status = 'needs_review'
      ↓
  emit: auto_completion.triggered
    data: { appointment_id, elapsed_minutes, end_time }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate: needs_review → completed           │
│  2. Transition:                      │
│     - confirmation_status: 'completed'           │
│     - status: 'completed'                        │
│     - completed_at: now                          │
│  3. Log: confirmation_logs           │
│     action: 'manually_set'           │
│     performed_by_role: 'system'      │
│     notes: 'Auto-completado por el sistema'      │
│  4. Emit outgoing events             │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested         ──────→  [NotificationListener]
    type: "auto_completed"                        → Notify staff
    channel: "in_app"
      ↓
  emit: calendar.refresh_requested     ──────→  [CacheInvalidationListener]
```

### 5.7 Flow G: Payroll Generation (from Payroll Action)

```
ADMIN ACTION: generatePayrollReceipt.ts
  └── Admin clicks "Generar recibo de nómina"
      ↓
  validate: user role ∈ {owner, admin}
  validate: period is in draft status
      ↓
  emit: payroll.receipt_requested
    data: {
      organization_id,
      employee_id,
      period_start, period_end,
      manual_trigger: true
    }
      ↓
┌──────────────────────────────────────┐
│         PayrollOrchestrator          │
│  1. Fetch all completed appointments in period   │
│     WHERE is_commissionable = true               │
│  2. Calculate commissions per service             │
│  3. Apply loan deductions                        │
│  4. Create payroll_receipt (draft)                │
│  5. Generate PDF                                 │
│  6. Emit events                                  │
└──────────────────────────────────────┘
      ↓
  emit: payroll.receipt_generated      ──────→  [AuditListener]
    data: { receipt_id, employee_id, net_pay }
      ↓
  emit: notification.requested         ──────→  [NotificationListener]
    type: "payroll_receipt_ready"
    channel: ["whatsapp", "email"]
    target: employee
```

### 5.8 Flow H: Cancellation Flow

```
ACTION: cancelConfirmation.ts (or cancelPublicBooking.ts)
  └── User/Client cancels appointment
      ↓
  validate: appointment.confirmation_status ≠ 'confirmed'
  validate: cancellation is allowed (time window, role)
      ↓
  emit: appointment.cancelled
    data: {
      appointment_id,
      cancellation_reason,
      cancelled_by_actor
    }
      ↓
┌──────────────────────────────────────┐
│         AppointmentOrchestrator      │
│  1. Validate: any_state → cancelled               │
│  2. Transition:                      │
│     - confirmation_status: 'cancelled'            │
│     - status: 'cancelled'                         │
│     - cancelled_at: now                           │
│  3. Log: confirmation_logs           │
│     action: 'cancelled'               │
│  4. Emit outgoing events             │
└──────────────────────────────────────┘
      ↓
  emit: notification.requested         ──────→  [NotificationListener]
    type: "appointment_cancelled"                  → Notify staff/client
    channel: ["in_app", "whatsapp", "email"]
      ↓
  emit: calendar.refresh_requested     ──────→  [CacheInvalidationListener]
      ↓
  emit: appointment.execution_completed           ──────→  [AuditListener]
```

---

## SECTION 6 — Orchestrator Design

### 6.1 AppointmentOrchestrator

The `AppointmentOrchestrator` is the **central authority** for all appointment state transitions. It is the ONLY component that may mutate appointment state.

#### 6.1.1 Responsibilities

```
RESPONSIBILITIES:
├── Validate state transitions (current state → target state)
├── Execute approved state mutations (DB writes)
├── Emit follow-up events (NOTIFICATION_REQUESTED, PAYROLL_REQUESTED, etc.)
├── Enforce idempotency (reject duplicate transitions)
├── Order concurrent events (first-wins with atomic DB check)
└── Track lifecycle completeness (emit EXECUTION_COMPLETED at terminal states)

NON-RESPONSIBILITIES:
├── Sending notifications (delegated to NotificationListener)
├── Generating payroll (delegated to PayrollListener)
├── Invalidating cache (delegated to CacheInvalidationListener)
├── Price calculations (done by actions, passed in event data)
└── Authorization (done by actions before event emission)
```

#### 6.1.2 State Machine Definition

```typescript
type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
type ConfirmationStatus = 'scheduled' | 'completed' | 'confirmed' | 'needs_review' | 'cancelled'

// Combined state = (status, confirmation_status)
type AppointmentState = {
  status: AppointmentStatus
  confirmation_status: ConfirmationStatus
}

// Valid transitions
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  // Format: "current_state_hash" → Set<target_event_name>

  // INITIAL: pending + scheduled
  '(pending,scheduled)': new Set([
    'appointment.cancelled',
    'service.completed',
    'service.completed_manually',
    'service.overdue',        // 60-min timeout
  ]),

  // Employee marked complete: completed + completed
  '(completed,completed)': new Set([
    'payment.confirmed',
    'appointment.cancelled',
    'auto_completion.triggered', // 120-min timeout (should not happen, but safe)
  ]),

  // Overdue: completed + needs_review
  '(completed,needs_review)': new Set([
    'payment.confirmed',
    'appointment.cancelled',
    'service.completed',          // employee finally marks it
    'service.completed_manually',  // staff overrides
    'auto_completion.triggered',
  ]),

  // Payment confirmed: completed + confirmed (TERMINAL)
  '(completed,confirmed)': new Set([]),

  // Cancelled (TERMINAL)
  '(cancelled,cancelled)': new Set([]),

  // No show (TERMINAL)
  '(no_show,cancelled)': new Set([]),
}
```

**Transition rules enforced:**

| From → To | Allowed Events | Conditions |
|-----------|---------------|------------|
| `(pending, scheduled)` → `(completed, completed)` | `service.completed`, `service.completed_manually` | Actor must be assigned employee or staff+ |
| `(pending, scheduled)` → `(completed, needs_review)` | `service.overdue` | Only emitted by cron detector |
| `(completed, completed)` → `(completed, confirmed)` | `payment.confirmed` | Actor must be staff+ |
| `(pending, scheduled)` → `(cancelled, cancelled)` | `appointment.cancelled` | Allowed for client or staff+ |
| `(completed, completed)` → `(cancelled, cancelled)` | `appointment.cancelled` | Only staff+ (client cannot cancel after service) |
| `(completed, needs_review)` → `(completed, confirmed)` | `payment.confirmed` | Normal reception flow |
| `(completed, needs_review)` → `(completed, completed)` | `service.completed`, `service.completed_manually`, `auto_completion.triggered` | Employee, staff override, or system |
| `(completed, needs_review)` → `(cancelled, cancelled)` | `appointment.cancelled` | Staff+ |

#### 6.1.3 Concurrency Handling

The orchestrator uses **optimistic locking** via `SELECT ... FOR UPDATE`:

```typescript
async function handleTransition(
  connection: DatabaseConnection,
  event: DomainEvent,
): Promise<TransitionResult> {
  // 1. Acquire row-level lock on appointment
  const appointment = await connection
    .from('appointments')
    .select('*')
    .eq('id', event.data.appointment_id)
    .forUpdate()  // LOCK — prevents concurrent transitions
    .single()

  if (!appointment) {
    return { rejected: true, reason: 'Appointment not found' }
  }

  // 2. Validate transition
  const fromState = stateKey(appointment.status, appointment.confirmation_status)
  if (!VALID_TRANSITIONS[fromState]?.has(event.event_name)) {
    await emit(STATE_TRANSITION_REJECTED, { ... })
    return { rejected: true, reason: 'Invalid transition' }
  }

  // 3. Check idempotency
  const existing = await connection
    .from('domain_events')
    .select('event_id')
    .eq('idempotency_key', event.metadata.idempotency_key)
    .single()

  if (existing) {
    return { rejected: true, reason: 'Duplicate event', idempotent: true }
  }

  // 4. Execute transition (atomic with event recording)
  const { newStatus, newConfStatus } = computeTargetState(event.event_name)
  await connection.transaction(async (tx) => {
    await tx.from('appointments').update({ ... }).eq('id', appointment.id)
    await tx.from('domain_events').insert(event)  // mark as processed
    await tx.from('confirmation_logs').insert({ ... })
  })

  // 5. Emit follow-up events
  await emitFollowUpEvents(event, { newStatus, newConfStatus })
  return { accepted: true }
}
```

#### 6.1.4 Event Fan-Out After Transition

After a successful transition, the orchestrator emits follow-up events based on the target state:

```typescript
async function emitFollowUpEvents(
  cause: DomainEvent,
  targetState: { status: string; confirmation_status: string }
): Promise<void> {
  const correlationId = cause.correlation_id
  const causationId = cause.event_id
  const baseMetadata = {
    organization_id: cause.organization_id,
    appointment_id: cause.data.appointment_id,
  }

  switch (cause.event_name) {
    case 'service.completed':
    case 'service.completed_manually':
    case 'auto_completion.triggered':
      await emit('notification.requested', { ...baseMetadata, notification_type: 'service_ready' }, { correlationId, causationId })
      await emit('calendar.refresh_requested', { organization_id: cause.organization_id, affected_dates: [today] }, { correlationId, causationId })
      break

    case 'payment.confirmed':
      await emit('payroll.generation_requested', { appointment_id: cause.data.appointment_id }, { correlationId, causationId })
      await emit('notification.requested', { ...baseMetadata, notification_type: 'confirmation_sent' }, { correlationId, causationId })
      await emit('calendar.refresh_requested', { ... }, { correlationId, causationId })
      await emit('appointment.execution_completed', { appointment_id: cause.data.appointment_id, final_status: 'completed' }, { correlationId, causationId })
      break

    case 'appointment.cancelled':
      await emit('notification.requested', { ...baseMetadata, notification_type: 'appointment_cancelled' }, { correlationId, causationId })
      await emit('calendar.refresh_requested', { ... }, { correlationId, causationId })
      await emit('appointment.execution_completed', { appointment_id: cause.data.appointment_id, final_status: 'cancelled' }, { correlationId, causationId })
      break

    case 'service.overdue':
      await emit('notification.requested', { ...baseMetadata, notification_type: 'unmarked_alert' }, { correlationId, causationId })
      break
  }
}
```

### 6.2 PayrollOrchestrator

A separate orchestrator for payroll-specific workflows:

```
RESPONSIBILITIES:
├── Validate payroll period state
├── Calculate commissions, deductions, net pay
├── Create payroll_receipt (draft)
├── Handle period transitions: draft → finalized → paid
└── Emit payroll lifecycle events
```

### 6.3 Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Single writer** | Only orchestrator writes appointment state |
| **Event sourcing light** | State = latest transition applied to initial state |
| **Atomic transitions** | Appointment state + domain_event + log in one DB transaction |
| **Pessimistic lock** | `SELECT ... FOR UPDATE` prevents concurrent transitions |
| **Idempotent consumers** | Listeners check if work already done before acting |
| **Fail isolation** | Listener failure never blocks orchestrator |

---

## SECTION 7 — Listener Architecture

### 7.1 Listener Pattern

Every listener follows the same contract:

```typescript
interface EventListener {
  readonly name: string
  readonly subscribedEvents: DomainEventName[]
  readonly maxRetries: number
  readonly retryDelayMs: number
  readonly deadLetterEnabled: boolean

  handle(event: DomainEvent): Promise<ListenerResult>
}
```

### 7.2 PayrollListener

| Property | Value |
|----------|-------|
| **Subscribed events** | `payroll.generation_requested`, `payroll.receipt_requested` |
| **Responsibilities** | Add appointment to payroll period, calculate commissions, generate receipts |
| **Retry strategy** | Exponential backoff: 5s → 25s → 125s (max 3 attempts) |
| **Failure isolation** | On failure: emit `payroll.failed`, move to dead-letter queue after max retries |
| **Idempotency strategy** | Upsert `period_commissions` with `onConflict: 'payroll_item_id, appointment_id, service_id'` with `ignoreDuplicates: true` |

```typescript
class PayrollListener implements EventListener {
  async handle(event: DomainEvent): Promise<ListenerResult> {
    switch (event.event_name) {
      case 'payroll.generation_requested':
        return this.addAppointmentToPayroll(event)
      case 'payroll.receipt_requested':
        return this.generatePayrollReceipt(event)
    }
  }

  private async addAppointmentToPayroll(event: DomainEvent) {
    // 1. Read appointment data (read-only!)
    // 2. Upsert payroll_period (YYYY-MM)
    // 3. Upsert payroll_item for employee
    // 4. Upsert period_commissions per service
    // 5. Recalculate item and period totals
    // 6. On success: emit payroll.generated
    // 7. On failure: retry or emit payroll.failed
  }
}
```

### 7.3 NotificationListener

| Property | Value |
|----------|-------|
| **Subscribed events** | `notification.requested`, `appointment.created` (legacy adapter) |
| **Responsibilities** | Check automation rules, render templates, queue messages, process channel adapters |
| **Retry strategy** | Batch processing via cron (every 5 min), per-item exponential backoff |
| **Failure isolation** | Dead-letter queue (`dead_letter_notifications` table) |
| **Idempotency strategy** | `idempotency_key` column on `notification_queue` (UNIQUE constraint) |

```typescript
class NotificationListener implements EventListener {
  async handle(event: DomainEvent): Promise<ListenerResult> {
    // 1. Fetch appointment data with joins
    // 2. Get automation rules for trigger event
    // 3. For each rule:
    //    a. Get provider config
    //    b. Render template
    //    c. Queue to notification_queue with idempotency_key
    //    d. If delayMinutes === 0, process immediately
    // 4. Return aggregated result
  }
}
```

### 7.4 AuditListener

| Property | Value |
|----------|-------|
| **Subscribed events** | ALL domain events |
| **Responsibilities** | Record every event in `domain_events` table, emit lifecycle summaries |
| **Retry strategy** | None (fire-and-forget after DB write) |
| **Failure isolation** | Log error, never throw (observability loss is acceptable) |
| **Idempotency strategy** | Natural: event_id is UUID PRIMARY KEY |

### 7.5 CacheInvalidationListener

| Property | Value |
|----------|-------|
| **Subscribed events** | `calendar.refresh_requested`, `appointment.execution_completed` |
| **Responsibilities** | Invalidate Next.js cache tags and paths for affected organization |
| **Retry strategy** | De-duplicate requests within 5-second window (batch into single revalidation) |
| **Failure isolation** | Catch errors, never throw |
| **Idempotency strategy** | Time-window dedup (multiple refresh requests collapse into one) |

```typescript
class CacheInvalidationListener implements EventListener {
  private pendingInvalidations: Map<string, Set<string>> = new Map()
  private debounceTimer: NodeJS.Timeout | null = null

  async handle(event: DomainEvent): Promise<ListenerResult> {
    const orgId = event.organization_id
    const tags = this.computeTags(event)

    // Accumulate tags within debounce window
    if (!this.pendingInvalidations.has(orgId)) {
      this.pendingInvalidations.set(orgId, new Set())
    }
    tags.forEach(t => this.pendingInvalidations.get(orgId)!.add(t))

    // Schedule batch invalidation (500ms debounce)
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => this.flush(), 500)

    return { success: true }
  }

  private async flush() {
    for (const [orgId, tags] of this.pendingInvalidations) {
      for (const tag of tags) {
        try { revalidateTag(tag) } catch (e) { /* safe */ }
      }
      revalidatePath('/calendar')
      revalidatePath('/payroll')
    }
    this.pendingInvalidations.clear()
  }
}
```

### 7.6 RealtimeListener

| Property | Value |
|----------|-------|
| **Subscribed events** | `appointment.*`, `notification.*` |
| **Responsibilities** | Push state changes to connected clients via Supabase Realtime |
| **Retry strategy** | None (Realtime handles its own delivery) |
| **Failure isolation** | Never throw |
| **Idempotency strategy** | N/A (Realtime is at-most-once delivery) |

### 7.7 Listener Registry

```typescript
const LISTENER_REGISTRY: Map<DomainEventName, EventListener[]> = new Map([
  ['payroll.generation_requested', [payrollListener]],
  ['payroll.receipt_requested', [payrollListener]],
  ['notification.requested', [notificationListener]],
  ['calendar.refresh_requested', [cacheInvalidationListener]],
  ['appointment.execution_completed', [auditListener, cacheInvalidationListener]],
  ['payment.confirmed', [auditListener]],
  ['service.completed', [auditListener]],
  ['service.completed_manually', [auditListener]],
  ['appointment.cancelled', [auditListener]],
  ['client.confirmed', [auditListener]],
  ['client.confirmed_manually', [auditListener]],
  ['price.adjusted', [auditListener]],
  ['payroll.generated', [auditListener]],
  ['payroll.failed', [auditListener]],
  ['state_transition.rejected', [auditListener]],
  ['service.overdue', [auditListener]],
  ['auto_completion.triggered', [auditListener]],
])
```

---

## SECTION 8 — Cron Event Architecture

### 8.1 Core Principle

Cron jobs become **Event Detectors Only**. They never mutate domain state directly.

```
Current:  Cron → mutate DB → send notifications → repeat
Future:   Cron → detect condition → emit event → orchestrator handles transition
```

### 8.2 Remainder Cron (`check-reminders`)

**Current behavior (lines 21-239 of `runCheckReminders.ts`):**
Three-phase pipeline with direct DB mutations and notification inserts.

**New behavior:**

```
┌─────────────────────────────────────────────────────────────┐
│  Cron: check-reminders (every 3 min)                        │
│                                                             │
│  Phase 1: Reminder (5 min before end_time)                  │
│  └→ Condition: end_time is within [now+4min, now+5min]     │
│     AND confirmation_status = 'scheduled'                   │
│     AND status = 'confirmed'                                │
│     AND < 2 reminders already sent in last 10min            │
│  └→ emit: notification.requested                           │
│       { notification_type: "appointment_reminder",          │
│         appointment_id, target: employee }                  │
│                                                             │
│  Phase 2: Overdue alert (60 min+ unmarked)                  │
│  └→ Condition: end_time <= now - 60min                     │
│     AND confirmation_status = 'scheduled'                   │
│     AND no SERVICE_OVERDUE event recorded for this window   │
│  └→ emit: service.overdue                                  │
│       { appointment_id, elapsed_minutes, end_time }         │
│                                                             │
│  Phase 3: Auto-complete (120 min+ in needs_review)          │
│  └→ Condition: end_time <= now - 120min                    │
│     AND confirmation_status = 'needs_review'                │
│     AND no AUTO_COMPLETION_TRIGGERED event recorded         │
│  └→ emit: auto_completion.triggered                        │
│       { appointment_id, elapsed_minutes, end_time }         │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Cron Batch Processing Pattern

```typescript
async function detectAndEmit(phase: DetectorPhase): Promise<DetectionResult> {
  // 1. Acquire distributed lock
  const lock = await acquireLock(`cron:${phase.name}`, {
    ttl: 60000,        // 60 second lock
    retryDelay: 1000,  // retry every 1s
    maxRetries: 5,
  })

  if (!lock.acquired) {
    return { skipped: true, reason: 'Another instance holds the lock' }
  }

  try {
    // 2. Fetch candidates with pagination
    const candidates = await fetchBatch(phase.query, BATCH_SIZE, phase.lastCursor)
    
    // 3. For each candidate, check if event already emitted (idempotency)
    const toEmit = []
    for (const apt of candidates) {
      const alreadyEmitted = await checkEventEmitted(
        phase.eventName,
        apt.id,
        phase.windowKey(apt)  // e.g., hour-precision window
      )
      if (!alreadyEmitted) {
        toEmit.push(apt)
      }
    }

    // 4. Emit events
    for (const apt of toEmit) {
      await emit(phase.eventName, {
        appointment_id: apt.id,
        elapsed_minutes: phase.elapsedMinutes,
        end_time: apt.end_time,
      })
    }

    // 5. Update cursor for next batch
    if (candidates.length === BATCH_SIZE) {
      await saveCursor(phase.name, candidates[candidates.length - 1].id)
      return { hasMore: true, emitted: toEmit.length }
    }

    return { hasMore: false, emitted: toEmit.length }
  } finally {
    await lock.release()
  }
}
```

### 8.4 Distributed Locking

```typescript
interface CronLock {
  acquired: boolean
  release: () => Promise<void>
}

async function acquireLock(
  lockKey: string,
  options: { ttl: number; retryDelay: number; maxRetries: number }
): Promise<CronLock> {
  const supabase = await createServiceRoleClient()
  
  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    // Use PG advisory lock or a lock table
    const { data } = await supabase.rpc('acquire_cron_lock', {
      p_lock_key: lockKey,
      p_ttl_ms: options.ttl,
    })

    if (data?.acquired) {
      return {
        acquired: true,
        release: async () => {
          await supabase.rpc('release_cron_lock', { p_lock_key: lockKey })
        }
      }
    }

    await sleep(options.retryDelay)
  }

  return { acquired: false, release: async () => {} }
}
```

### 8.5 Overlap Prevention

| Mechanism | How It Works |
|-----------|-------------|
| **Distributed lock** | PG advisory lock prevents concurrent runs of same cron job |
| **Idempotency check** | Check `domain_events` table for existing event before emitting |
| **Cursor tracking** | Save position in batch to resume after crash |
| **Heartbeat** | If no heartbeat for 2x cron interval, lock is considered stale and can be force-released |

### 8.6 Cron Job Table

```sql
CREATE TABLE cron_state (
  job_name        TEXT PRIMARY KEY,
  last_run_at     TIMESTAMPTZ NOT NULL,
  last_cursor     TEXT,           -- pagination cursor for batch processing
  last_event_id   TEXT,           -- last emitted event_id for dedup
  total_processed INTEGER DEFAULT 0,
  total_errors    INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'idle',
    -- idle | running | completed | failed
  lock_expires_at TIMESTAMPTZ,   -- for dead coordinator detection
  metadata        JSONB DEFAULT '{}'
);
```

### 8.7 Purge Cron

The existing `purge-appointments` cron is also migrated to event-driven:

```
CRON: purge-appointments (daily)
  └→ For each organization with auto_purge_enabled = true:
     └→ Detect appointments older than auto_retention_days
        with terminal status (completed, cancelled, no_show)
        and no invoice
     └→ emit: appointment.purge_requested
        { appointment_ids: [...] }
        ↓
  AppointmentOrchestrator validates deletion is safe
        ↓
  AuditListener records the purge event
```

---

## SECTION 9 — Payroll Event Decoupling

### 9.1 The Problem

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
|-------|-------------|
| Fire-and-forget with `.then()` | No guarantee of execution |
| `.catch()` only logs | Failure is invisible to operators |
| No idempotency check across restarts | Duplicate payroll entries on re-run |
| No ordering with notifications | Payroll may process before or after notification |
| No retry mechanism | Transient DB failure = permanent data loss |
| No dead-letter queue | Failed payroll entries are silently dropped |
| Coupled to `confirmService` | Cannot replay payroll for past appointments |

### 9.2 New Architecture

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

### 9.3 Retry Workflow

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

### 9.4 Dead-Letter Queue

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

### 9.5 Replay Strategy

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

## SECTION 10 — Observability & Audit Architecture

### 10.1 Audit Logging

Every domain event is recorded in the `domain_events` table with full metadata:

```
domain_events
├── event_id          (unique identifier for traceability)
├── event_name        (machine-readable event type)
├── event_version     (for schema evolution)
├── correlation_id    (entire business flow trace)
├── causation_id      (parent event link)
├── organization_id   (tenant isolation)
├── aggregate_id      (entity ID, e.g., appointment_id)
├── aggregate_type    (entity type)
├── actor_id          (WHO did it)
├── actor_role        (WHAT role did they have)
├── actor_source      (WHERE from: web_app, employee_app, cron, etc.)
├── occurred_at       (WHEN it happened in business time)
├── recorded_at       (WHEN the system recorded it)
├── data              (WHAT changed - full payload)
├── metadata          (HOW - request_id, ip, user_agent, retry info)
├── status            (pending | processing | completed | failed)
├── retry_count       (how many times it was retried)
└── last_error        (failure information if failed)
```

### 10.2 Trace an Appointment Lifecycle

```sql
-- Get full lifecycle for a specific appointment
SELECT event_name, actor_role, actor_source, occurred_at, data->>'status' as new_status
FROM domain_events
WHERE aggregate_id = 'appointment-uuid-here'
  AND aggregate_type = 'appointment'
ORDER BY occurred_at ASC;

-- Response:
-- appointment.created        | client    | public_booking | pending
-- notification.requested     | system    | orchestrator   | null
-- service.completed          | employee  | employee_app   | completed
-- notification.requested     | system    | orchestrator   | null
-- payment.confirmed          | staff     | web_app        | confirmed
-- payroll.generation_requested | system | orchestrator    | null
-- payroll.generated          | system    | payroll_listener | null
-- appointment.execution_completed | system | orchestrator  | null
```

### 10.3 Debug Failures

```sql
-- Find all failed events in the last 24 hours
SELECT event_name, aggregate_id, last_error, retry_count, occurred_at
FROM domain_events
WHERE status = 'failed'
  AND recorded_at > NOW() - INTERVAL '24 hours'
ORDER BY recorded_at DESC;

-- Find an appointment's failed retries
SELECT event_name, metadata->>'retry_attempt' as attempt, last_error, recorded_at
FROM domain_events
WHERE correlation_id = (
  SELECT correlation_id FROM domain_events
  WHERE event_name = 'appointment.created'
    AND aggregate_id = 'appointment-uuid-here'
  LIMIT 1
)
AND status = 'failed'
ORDER BY recorded_at ASC;
```

### 10.4 Detect Stuck Workflows

```sql
-- Appointments that never reached terminal state within time limit
SELECT a.id, a.status, a.confirmation_status, a.created_at,
       CASE
         WHEN a.confirmation_status = 'scheduled'
           AND a.end_time < NOW() - INTERVAL '60 minutes'
           THEN 'STUCK: waiting for employee mark'
         WHEN a.confirmation_status = 'needs_review'
           AND a.end_time < NOW() - INTERVAL '120 minutes'
           THEN 'STUCK: waiting for confirmation or auto-complete'
         WHEN a.status = 'completed'
           AND a.confirmation_status = 'confirmed'
           AND NOT EXISTS (
             SELECT 1 FROM domain_events de
             WHERE de.aggregate_id = a.id
               AND de.event_name = 'payroll.generated'
           )
           THEN 'STUCK: payroll not generated'
         ELSE 'normal'
       END AS workflow_status
FROM appointments a
WHERE a.status NOT IN ('cancelled')
  AND a.created_at > NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;
```

### 10.5 Event Sourcing Light (Replay)

The event log supports **state reconstruction** of any appointment:

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

### 10.6 Monitoring Dashboard Queries

```sql
-- Events per minute (real-time throughput)
SELECT date_trunc('minute', recorded_at) as minute,
       event_name,
       COUNT(*) as count
FROM domain_events
WHERE recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY minute, event_name
ORDER BY minute DESC;

-- Failed events per hour
SELECT date_trunc('hour', recorded_at) as hour,
       COUNT(*) as failures
FROM domain_events
WHERE status = 'failed'
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Dead-letter queue size
SELECT COUNT(*) as dead_letter_count
FROM payroll_dead_letter
WHERE status = 'pending';

-- Listener lag (time between event recorded and processed)
SELECT event_name,
       AVG(EXTRACT(EPOCH FROM (processed_at - recorded_at))) as avg_lag_seconds,
       MAX(EXTRACT(EPOCH FROM (processed_at - recorded_at))) as max_lag_seconds
FROM domain_events
WHERE status = 'completed'
  AND processed_at IS NOT NULL
  AND recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY event_name
ORDER BY avg_lag_seconds DESC;
```

### 10.7 Dead-Letter Queue Dashboard

A realtime dashboard provides:

| Metric | Source | Refresh |
|--------|--------|---------|
| Total dead-lettered events | `payroll_dead_letter` | 30s |
| Events per appointment | `domain_events` | Real-time |
| Failed transitions | `state_transition.rejected` events | Real-time |
| Average transition latency | `domain_events.processed_at - recorded_at` | 1min |
| Stuck appointments | Query from [10.4](#104-detect-stuck-workflows) | 5min |

---

## SECTION 11 — Migration Strategy

### 11.1 Core Principle: No Big Rewrite

The migration follows the **Strangler Fig Pattern**: new event-driven code runs alongside legacy code, with incremental replacement of pathways.

```
Phase 1: Coexistence
├── Legacy code continues to work unchanged
├── New event infrastructure is read-only (no state mutation)
├── Events are emitted alongside existing mutations (dual-write)
└── Observability is built (validate events match mutations)

Phase 2: Read from Events
├── Listeners become active but operate read-only
├── Orchestrator handles transitions via events
├── Legacy mutations are wrapped to emit events
├── Dual-write continues for rollback safety

Phase 3: Write via Events
├── Legacy mutations disabled one-by-one
├── All state changes go through orchestrator
├── Actions emit events only
├── Cron jobs emit events only
└── Legacy code is removed
```

### 11.2 Phase 1 — Compatibility Adapters (Current → Event)

**Goal:** Emit events without changing existing behavior.

```typescript
// Legacy action wrapper (phase 1)
export async function confirmService(...) {
  // 1. Execute legacy logic (unchanged)
  const result = await legacyConfirmService(...)

  // 2. Emit event for new infrastructure (dual-write)
  if (result.success) {
    await eventBus.emit('payment.confirmed', {
      appointment_id: appointmentId,
      payment_method: rawData.paymentMethod,
      // ... rest of payload
    }, {
      // Use a known correlation_id or generate one
      correlation_id: result.correlationId ?? crypto.randomUUID(),
      causation_id: crypto.randomUUID(),
    })
  }

  return result // Legacy return value (unchanged)
}
```

**Safety checks during Phase 1:**

```typescript
async function validateEventConsistency(legacyResult: any, emittedEvent: DomainEvent) {
  // Read state after legacy mutation
  const stateAfterLegacy = await readAppointmentState(emittedEvent.data.appointment_id)
  
  // Compute what the orchestrator WOULD have done
  const expectedState = applyTransition(
    stateBeforeEvent,
    emittedEvent.event_name,
    emittedEvent.data
  )

  if (stateAfterLegacy !== expectedState) {
    console.error('[EVENT CONSISTENCY FAILURE]', {
      event: emittedEvent.event_name,
      appointment: emittedEvent.data.appointment_id,
      expected: expectedState,
      actual: stateAfterLegacy,
    })
    // Alert operator but do NOT block the legacy flow
  }
}
```

### 11.3 Phase 2 — Progressive Orchestration

**Goal:** Orchestrator handles transitions. Legacy code becomes a thin wrapper.

```typescript
// Phase 2: Action emits event, listens for result
export async function confirmService(...) {
  // 1. Validate input and authorize
  const parsed = ConfirmServiceSchema.safeParse(rawData)
  
  // 2. Calculate price (same logic as before)
  const price = await calculatePrice(appointmentId)

  // 3. Emit event (replaces direct mutation)
  const result = await eventBus.emitAndWait('payment.confirmed', {
    appointment_id: appointmentId,
    payment_method: parsed.data.paymentMethod,
    price_before: price,
    price_after: price,
    notes: parsed.data.notes,
  }, {
    correlation_id: crypto.randomUUID(),
    causation_id: crypto.randomUUID(),
    wait_for: 'appointment.execution_completed', // Wait for orchestrator
    timeout_ms: 10000,
  })

  if (result.status === 'rejected') {
    return { success: false, error: result.rejection_reason }
  }

  // 4. Return to UI (no direct mutations, no side effects)
  return { success: true, appointmentId }
}
```

**Transition by transition:**

| Transition | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| Appointment created | Legacy + emit event | Action emits event (orchestrator validates) | Event-only |
| Service completed | Legacy + emit event | Action emits event (orchestrator validates) | Event-only |
| Payment confirmed | Legacy + emit event (with payroll suppression) | Action emits event (orchestrator handles payroll) | Event-only |
| Cron reminders | Legacy + emit event | Cron emits events (orchestrator handles) | Event-only |
| Cron auto-complete | Legacy + emit event | Cron emits events (orchestrator handles) | Event-only |

### 11.4 Phase 3 — Legacy Removal

**Rollout order (safe to rollback independently):**

```
Rollout 1: Event infrastructure (phase 1 - silent emission only)
  └→ Creates domain_events table, event bus, AuditListener
  └→ Rollback: Drop domain_events table, remove emit() calls

Rollout 2: NotificationListener (read-only)
  └→ Starts processing notification.requested events
  └→ Legacy notification code still runs alongside
  └→ Rollback: Disable NotificationListener, legacy code untouched

Rollout 3: Cron migration (emit-only)
  └→ Cron emits events instead of mutating state
  └→ Orchestrator validates and transitions
  └→ Rollback: Revert cron to legacy code

Rollout 4: Payroll decoupling
  └→ PayrollListener becomes active
  └→ Legacy fire-and-forget code is removed
  └→ Rollback: Re-enable legacy payroll in confirmService

Rollout 5: Action migration (emit-only)
  └→ Actions stop mutating state directly
  └→ All mutations go through orchestrator
  └→ Rollback: Revert actions to legacy code
```

### 11.5 Rollback Strategy

```typescript
// Feature flag for event-driven architecture
const EVENT_DRIVEN_ENABLED = {
  payroll: false,     // Rollout 4
  cron: false,        // Rollout 3
  notifications: false, // Rollout 2
  transitions: false,  // Rollout 5
}

// In each action:
if (EVENT_DRIVEN_ENABLED.transitions) {
  return await emitAndWait(event_name, data)
} else {
  return await legacyMutation(data)
}
```

### 11.6 Error Budget During Migration

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| Event consistency failure | > 0.1% of events | > 1% of events |
| Listener processing lag | > 60 seconds avg | > 5 minutes max |
| Dead-letter growth rate | > 10/hour | > 100/hour |
| Stuck appointments | > 0.5% of daily | > 2% of daily |
| Rollback events | N/A | Any single rollback |

---

## SECTION 12 — Recommended Folder Structure

### 12.1 Architecture Overview

```
src/
├── core/                          # ← NEW: Domain architecture
│   ├── events/
│   │   ├── registry.ts            # EventRegistry — central event catalog
│   │   ├── emitter.ts             # EventEmitter — emit and fan-out
│   │   ├── consumer.ts            # EventConsumer — poll and dispatch
│   │   ├── retry.ts               # Retry policies + exponential backoff
│   │   ├── types.ts               # DomainEvent, DomainEventName, etc.
│   │   └── validators/            # Zod schemas per event
│   │       ├── appointment.events.ts
│   │       ├── payment.events.ts
│   │       ├── payroll.events.ts
│   │       ├── notification.events.ts
│   │       └── cron.events.ts
│   │
│   ├── orchestrators/
│   │   ├── appointment.orchestrator.ts  # Appointment state machine
│   │   ├── payroll.orchestrator.ts      # Payroll workflow
│   │   ├── transition-map.ts            # VALID_TRANSITIONS definition
│   │   └── transition-validator.ts      # Transition validation logic
│   │
│   ├── listeners/
│   │   ├── payroll.listener.ts      # PAYROLL_GENERATION_REQUESTED handler
│   │   ├── notification.listener.ts # NOTIFICATION_REQUESTED handler
│   │   ├── audit.listener.ts        # Universal event recorder
│   │   ├── cache-invalidation.listener.ts  # Calendar/tag invalidation
│   │   ├── realtime.listener.ts     # Supabase Realtime bridge
│   │   └── registry.ts              # ListenerRegistry
│   │
│   ├── state-machine/
│   │   ├── appointment-states.ts    # State definitions + transitions
│   │   ├── payroll-states.ts        # Payroll period states
│   │   └── types.ts                 # Shared state types
│   │
│   ├── cron/
│   │   ├── detectors/
│   │   │   ├── reminder.detector.ts     # Phase 1: 5-min reminders
│   │   │   ├── overdue.detector.ts      # Phase 2: 60-min overdue
│   │   │   ├── auto-complete.detector.ts # Phase 3: 120-min auto-complete
│   │   │   ├── purge.detector.ts        # Data retention purge
│   │   │   └── payroll-period.detector.ts # End-of-period detection
│   │   ├── base-detector.ts         # Shared detector pattern
│   │   ├── lock.ts                  # Distributed locking (PG advisory)
│   │   ├── cursor.ts                # Pagination cursor management
│   │   └── types.ts                 # Cron types
│   │
│   ├── dead-letter/
│   │   ├── payroll.dlq.ts           # Payroll dead-letter management
│   │   ├── notification.dlq.ts      # Notification dead-letter management
│   │   └── reconciliation.ts        # DLQ cleanup + replay tools
│   │
│   ├── audit/
│   │   ├── event-logger.ts          # domain_events table writer
│   │   ├── consistency-checker.ts   # Validate legacy ↔ event parity
│   │   ├── reconstructor.ts         # State reconstruction from events
│   │   └── queries.ts               # Common audit SQL queries
│   │
│   └── migration/
│       ├── feature-flags.ts         # EVENT_DRIVEN_ENABLED flags
│       ├── adapters/
│       │   ├── legacy-action-adapter.ts  # Wraps legacy actions to emit events
│       │   └── cron-adapter.ts           # Wraps legacy cron to emit events
│       └── consistency-validator.ts      # Phase 1 validation
│
├── actions/                        # ← EXISTING (refactored to emit events)
│   ├── confirmations/
│   │   ├── confirmService.ts       # REFACTORED: emit → orchestrator handles
│   │   ├── markCompleted.ts        # REFACTORED: emit → orchestrator handles
│   │   ├── markManually.ts         # REFACTORED: emit OVERRIDE event
│   │   ├── adjustPrice.ts          # REFACTORED: emit price.adjusted
│   │   ├── cancelConfirmation.ts   # REFACTORED: emit appointment.cancelled
│   │   └── ... (unchanged schema, token files)
│   ├── cron/
│   │   └── runCheckReminders.ts    # REFACTORED: emit-only, no mutations
│   ├── payroll/
│   │   ├── addAppointmentToPayroll.ts # MOVED: logic to PayrollListener
│   │   └── ... (receipt generation stays)
│   └── ... (other actions mostly unchanged)
│
├── lib/                            # ← EXISTING (mostly unchanged)
│   ├── supabase/
│   ├── notifications/
│   └── payroll/
│
├── app/api/
│   ├── cron/
│   │   ├── process-notifications/route.ts  # ← EXISTING
│   │   ├── check-reminders/route.ts         # ← EXISTING (calls detector)
│   │   └── purge-appointments/route.ts     # ← EXISTING (calls detector)
│   └── events/
│       ├── emit/route.ts           # HTTP endpoint for external event emission
│       └── replay/route.ts         # HTTP endpoint for event replay (admin)
│
├── types/
│   └── domain-events.ts            # TypeScript types for all events
│
└── docs/
    └── DOMAIN_EVENT_ARCHITECTURE.md  # THIS DOCUMENT
```

### 12.2 File Responsibilities

| File | Responsibility | Read/Write |
|------|---------------|------------|
| `core/events/emitter.ts` | Emit events to the event bus (DB + notifications) | Write events |
| `core/events/consumer.ts` | Poll domain_events table, dispatch to listeners | Read events |
| `core/events/registry.ts` | Central catalog of all events with schemas | Read (config) |
| `core/orchestrators/appointment.orchestrator.ts` | Validate transitions, mutate state, emit follow-ups | Write state + events |
| `core/orchestrators/payroll.orchestrator.ts` | Payroll period lifecycle | Write payroll |
| `core/listeners/payroll.listener.ts` | Add appointment to payroll on PAYMENT_CONFIRMED | Write payroll |
| `core/listeners/notification.listener.ts` | Queue and send notifications | Write queue |
| `core/listeners/cache-invalidation.listener.ts` | Invalidate Next.js cache | Write cache (RPC) |
| `core/audit/event-logger.ts` | Record all events to domain_events table | Write events |
| `core/cron/detectors/*.ts` | Detect conditions, emit events | Read state, Write events |
| `core/dead-letter/*.ts` | Manage failed events | Read/write DLQ |
| `core/migration/*.ts` | Legacy compatibility during migration | Dual-write |

### 12.3 Event Processing Flow

```
1. TRIGGER: User action, Cron detector, Webhook
   ↓
2. EMIT: core/events/emitter.ts
   ├── INSERT INTO domain_events (status: 'pending')
   └── NOTIFY pg_notify('domain_events', event_id)
   ↓
3. CONSUME: core/events/consumer.ts
   ├── LISTEN pg_notify OR poll domain_events WHERE status = 'pending'
   ├── UPDATE status = 'processing'
   ├── Route to orchestrator (if state transition event)
   └── Route to listeners (if side-effect event)
   ↓
4. ORCHESTRATE: core/orchestrators/
   ├── SELECT ... FOR UPDATE (lock entity)
   ├── Validate transition
   ├── Execute state mutation
   ├── INSERT confirmation_logs
   ├── UPDATE domain_events SET status = 'completed'
   └── Emit follow-up events
   ↓
5. LISTEN: core/listeners/
   ├── Execute side effect (payroll, notification, cache)
   ├── On success: no action (event already 'processing')
   └── On failure: retry or move to DLQ
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Domain Event** | A record of something that happened in the business domain |
| **Event Envelope** | The standardized wrapper around every event (event_id, correlation_id, etc.) |
| **Correlation ID** | UUID that traces an entire business flow across all events |
| **Causation ID** | The event_id of the event that caused this event |
| **Aggregate** | A cluster of domain objects treated as a unit (e.g., an Appointment) |
| **Orchestrator** | Component that validates transitions and coordinates workflow |
| **Listener** | Component that executes side effects in response to events |
| **Event Detector** | Cron job that detects conditions and emits events (never mutates state) |
| **Dead-Letter Queue** | Storage for events that failed after max retries |
| **Idempotency Key** | Unique key that prevents duplicate processing of the same event |
| **Event Sourcing Light** | Recording events alongside current state (not replacing state) |
| **Strangler Fig Pattern** | Incrementally replacing legacy code with new code alongside it |

## Appendix B: Supabase Integration Points

| Component | Supabase Feature | Purpose |
|-----------|-----------------|---------|
| Event bus | `pg_notify` + LISTEN | Real-time event notification to consumer |
| Event store | `domain_events` table | Persistent event log |
| Distributed lock | Advisory lock or `cron_state` table | Prevent concurrent cron execution |
| Orchestrator | `SELECT ... FOR UPDATE` | Pessimistic locking for state transitions |
| Listener | `UPDATE ... WHERE id = ANY(...)` | Batch claim pending events |
| Dead-letter | `payroll_dead_letter` table | Failed event storage |
| Audit | `domain_events` table | Queryable event history |
| Realtime | Supabase Realtime | Push state changes to UI |

---

> **END OF DOCUMENT**
>
> This architecture transforms Prügressy from a side-effect-coupled monolith into a resilient, auditable, event-driven platform. All 12 sections are designed for safe incremental migration, preserving operational flexibility while eliminating the root causes of inconsistent state, silent failures, and untraceable transitions.
