# Migration Strategy

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Folder Structure](16-folder-structure.md)  
> **Next:** [README.md](README.md) (index)  
> **Index:** [README.md](README.md)

---

## Core Principle: No Big Rewrite

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

## Phase 1 — Compatibility Adapters (Current → Event)

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

## Phase 2 — Progressive Orchestration

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
|---|---|---|---|
| Appointment created | Legacy + emit event | Action emits event (orchestrator validates) | Event-only |
| Service completed | Legacy + emit event | Action emits event (orchestrator validates) | Event-only |
| Payment confirmed | Legacy + emit event (with payroll suppression) | Action emits event (orchestrator handles payroll) | Event-only |
| Cron reminders | Legacy + emit event | Cron emits events (orchestrator handles) | Event-only |
| Cron auto-complete | Legacy + emit event | Cron emits events (orchestrator handles) | Event-only |

## Phase 3 — Legacy Removal

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

## Rollback Strategy

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

## Error Budget During Migration

| Metric | Warning Threshold | Critical Threshold |
|---|---|---|
| Event consistency failure | > 0.1% of events | > 1% of events |
| Listener processing lag | > 60 seconds avg | > 5 minutes max |
| Dead-letter growth rate | > 10/hour | > 100/hour |
| Stuck appointments | > 0.5% of daily | > 2% of daily |
| Rollback events | N/A | Any single rollback |

---

## Navigation

- **Previous:** [Folder Structure](16-folder-structure.md)
- **Next:** [README.md](README.md) (index)
- **Index:** [README.md](README.md)
