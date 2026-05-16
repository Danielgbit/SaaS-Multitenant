# Orchestrator Architecture

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [State Machines](06-state-machines.md)  
> **Next:** [Event Classification](08-event-classification.md)  
> **Index:** [README.md](README.md)

---

## Responsibilities

The `AppointmentOrchestrator` is the **central authority** for all appointment state transitions. It is the ONLY component that may mutate appointment state.

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

---

## Command Pipeline

The command pipeline is the entry point for all state transition requests.

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMAND PIPELINE                          │
│                                                             │
│  1. Receive event (from event bus)                          │
│  2. Load current state (SELECT ... FOR UPDATE)              │
│  3. Validate transition (call State Machine)                │
│  4. Check idempotency (domain_events.idempotency_key)       │
│  5. Execute transition (UPDATE + INSERT + INSERT in TX)    │
│  6. Emit follow-up events                                   │
│  7. Return result                                           │
└─────────────────────────────────────────────────────────────┘
```

### Flow A: Client Confirmation (Automatic)

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

### Flow B: Manual Client Confirmation (Override)

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

### Flow C: Employee Marks Completed

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

### Flow D: Manual Service Completion (Override)

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

### Flow E: Payment Confirmation

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

### Flow F: Auto-Complete Cron Flow

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

### Flow G: Payroll Generation (from Payroll Action)

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

### Flow H: Cancellation Flow

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

## Validation Pipeline

The orchestrator validates each event before executing the transition.

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

  // 2. Validate transition via state machine
  const fromState = stateKey(appointment.status, appointment.confirmation_status)
  const validation = validateTransition(fromState, event.event_name, event.actor_role)
  if (!validation.valid) {
    await emit(STATE_TRANSITION_REJECTED, {
      appointment_id: event.data.appointment_id,
      from_state: fromState,
      attempted_event: event.event_name,
      rejection_reason: validation.reason,
    })
    return { rejected: true, reason: validation.reason }
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
    await tx.from('appointments').update({
      status: newStatus,
      confirmation_status: newConfStatus,
      ...timestamps,
      ...paymentFields,
    }).eq('id', appointment.id)

    await tx.from('domain_events').insert({
      ...event,
      status: 'completed',
      processed_at: new Date().toISOString(),
    })

    await tx.from('confirmation_logs').insert({
      appointment_id: appointment.id,
      organization_id: appointment.organization_id,
      action: computeLogAction(event.event_name),
      performed_by: event.actor_id,
      performed_by_role: event.actor_role,
      price_before: event.data.price_before,
      price_after: event.data.price_after,
      payment_method: event.data.payment_method,
      notes: event.data.notes || event.data.reason,
    })
  })

  // 5. Emit follow-up events
  await emitFollowUpEvents(event, { newStatus, newConfStatus })
  return { accepted: true }
}
```

---

## State Machine Coordination

The orchestrator coordinates with the state machine but does NOT contain state machine logic.

```
┌──────────────┐     current_state     ┌──────────────────┐
│ Orchestrator │──────────────────────►│  StateMachine    │
│              │                       │                  │
│              │◄──────────────────────│  valid/invalid   │
│              │     validation_result  │  + target_state  │
└──────────────┘                       └──────────────────┘
       │
       │ (if valid)
       ▼
┌──────────────┐
│  Execute TX  │
│  UPDATE appt │
│  INSERT log  │
│  INSERT event│
└──────────────┘
       │
       ▼
┌──────────────┐
│  Emit events │
└──────────────┘
```

---

## Transaction Boundaries

Each orchestrated transition is atomic:

```typescript
await connection.transaction(async (tx) => {
  // 1. Mutate appointment state (domain tables)
  await tx.from('appointments').update({ ... }).eq('id', appointment.id)

  // 2. Record event as processed (event log)
  await tx.from('domain_events').insert({
    ...event,
    status: 'completed',
    processed_at: new Date().toISOString(),
  })

  // 3. Write audit log
  await tx.from('confirmation_logs').insert({ ... })
})
// ← All or nothing. If any step fails, entire transaction rolls back.
```

**Transaction boundaries ensure:**
- State mutation + event recording + audit log are atomic
- No partial state visible to other components
- If event emission fails after transaction, orchestrator retries (event is already marked completed)
- If transaction fails, event stays `pending` and consumer retries

---

## Concurrency & Locks

### Optimistic Locking via SELECT FOR UPDATE

```typescript
async function handleTransition(
  connection: DatabaseConnection,
  event: DomainEvent,
): Promise<TransitionResult> {
  // Acquire row-level lock on appointment
  const appointment = await connection
    .from('appointments')
    .select('*')
    .eq('id', event.data.appointment_id)
    .forUpdate()  // LOCK — prevents concurrent transitions
    .single()
  // ...
```

### Concurrency Scenarios

| Scenario | Resolution |
|---|---|
| Two events arrive simultaneously for same appointment | `SELECT ... FOR UPDATE` serializes. Second request waits. |
| Event arrives while transaction is in progress | Second request waits until first completes. Re-reads state. |
| Duplicate event (UI double-click) | Idempotency key check prevents duplicate transition. |
| Cron event + Manual event for same appointment | Lock serializes. First event wins. Second validates against new state. |

---

## Event Emission

### Event Fan-Out After Transition

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
      await emit('notification.requested',
        { ...baseMetadata, notification_type: 'service_ready' },
        { correlationId, causationId })
      await emit('calendar.refresh_requested',
        { organization_id: cause.organization_id, affected_dates: [today] },
        { correlationId, causationId })
      break

    case 'payment.confirmed':
      await emit('payroll.generation_requested',
        { appointment_id: cause.data.appointment_id },
        { correlationId, causationId })
      await emit('notification.requested',
        { ...baseMetadata, notification_type: 'confirmation_sent' },
        { correlationId, causationId })
      await emit('calendar.refresh_requested', { ... }, { correlationId, causationId })
      await emit('appointment.execution_completed',
        { appointment_id: cause.data.appointment_id, final_status: 'completed' },
        { correlationId, causationId })
      break

    case 'appointment.cancelled':
      await emit('notification.requested',
        { ...baseMetadata, notification_type: 'appointment_cancelled' },
        { correlationId, causationId })
      await emit('calendar.refresh_requested', { ... }, { correlationId, causationId })
      await emit('appointment.execution_completed',
        { appointment_id: cause.data.appointment_id, final_status: 'cancelled' },
        { correlationId, causationId })
      break

    case 'service.overdue':
      await emit('notification.requested',
        { ...baseMetadata, notification_type: 'unmarked_alert' },
        { correlationId, causationId })
      break
  }
}
```

---

## Side Effect Coordination

The orchestrator coordinates side effects but does NOT execute them.

```
Orchestrator
  │
  ├── emit: payroll.generation_requested   ──→  PayrollListener
  │     (handles retries, DLQ, idempotency)
  │
  ├── emit: notification.requested         ──→  NotificationListener
  │     (handles channels, templates, rate limits)
  │
  ├── emit: calendar.refresh_requested     ──→  CacheInvalidationListener
  │     (handles debouncing, batching)
  │
  └── emit: appointment.execution_completed  ──→  AuditListener
        (handles recording, lifecycle tracking)
```

**Rules:**
- Orchestrator NEVER directly sends notifications
- Orchestrator NEVER directly writes to payroll tables
- Orchestrator NEVER directly invalidates cache
- Orchestrator's only side effect is emitting events
- Listener failures do NOT affect orchestrator

---

## Listener Architecture

### Listener Pattern

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

### PayrollListener

| Property | Value |
|---|---|
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

### NotificationListener

| Property | Value |
|---|---|
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

### AuditListener

| Property | Value |
|---|---|
| **Subscribed events** | ALL domain events |
| **Responsibilities** | Record every event in `domain_events` table, emit lifecycle summaries |
| **Retry strategy** | None (fire-and-forget after DB write) |
| **Failure isolation** | Log error, never throw (observability loss is acceptable) |
| **Idempotency strategy** | Natural: event_id is UUID PRIMARY KEY |

### CacheInvalidationListener

| Property | Value |
|---|---|
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

    if (!this.pendingInvalidations.has(orgId)) {
      this.pendingInvalidations.set(orgId, new Set())
    }
    tags.forEach(t => this.pendingInvalidations.get(orgId)!.add(t))

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

### RealtimeListener

| Property | Value |
|---|---|
| **Subscribed events** | `appointment.*`, `notification.*` |
| **Responsibilities** | Push state changes to connected clients via Supabase Realtime |
| **Retry strategy** | None (Realtime handles its own delivery) |
| **Failure isolation** | Never throw |
| **Idempotency strategy** | N/A (Realtime is at-most-once delivery) |

### Listener Registry

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

## Failure Recovery

| Failure Point | Recovery Mechanism |
|---|---|
| Orchestrator transaction fails | Event stays `pending`. Consumer retries. |
| Orchestrator transaction succeeds but event emission fails | Event is marked `completed`. Follow-up events are re-emitted by reconciliation. |
| Listener fails (retryable) | Exponential backoff. Max 3 retries. → DLQ. |
| Listener fails (permanent) | Immediate DLQ. Operator alert. |
| Dead-letter event | Manual replay via admin console. |

---

## Reconciliation

Periodic reconciliation detects inconsistencies:

```typescript
async function reconcileAppointmentState(appointmentId: string): Promise<void> {
  const dbState = await db.from('appointments')
    .select('status, confirmation_status')
    .eq('id', appointmentId)
    .single()

  const events = await db.from('domain_events')
    .select('event_name, data, occurred_at')
    .eq('aggregate_id', appointmentId)
    .eq('aggregate_type', 'appointment')
    .in('event_name', TRANSITION_EVENTS)
    .order('occurred_at', { ascending: true })

  const reconstructed = events.reduce(
    (state, event) => applyTransition(state, event.event_name, event.data),
    initialState
  )

  if (dbState.status !== reconstructed.status ||
      dbState.confirmation_status !== reconstructed.confirmation_status) {
    console.error('[RECONCILIATION FAILURE]', { appointmentId, dbState, reconstructed })
  }
}
```

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

## Design Principles

| Principle | Implementation |
|---|---|
| **Single writer** | Only orchestrator writes appointment state |
| **Event sourcing light** | State = latest transition applied to initial state |
| **Atomic transitions** | Appointment state + domain_event + log in one DB transaction |
| **Pessimistic lock** | `SELECT ... FOR UPDATE` prevents concurrent transitions |
| **Idempotent consumers** | Listeners check if work already done before acting |
| **Fail isolation** | Listener failure never blocks orchestrator |

---

## Navigation

- **Previous:** [State Machines](06-state-machines.md)
- **Next:** [Event Classification](08-event-classification.md)
- **Index:** [README.md](README.md)
