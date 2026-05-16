# State Machines

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Domain Invariants](05-domain-invariants.md)  
> **Next:** [Orchestrator Architecture](07-orchestrator-architecture.md)  
> **Index:** [README.md](README.md)

---

## Separation of Concerns

State machines are separated from orchestrators because they serve fundamentally different purposes:

| Concern | State Machine | Orchestrator |
|---|---|---|
| **Responsibility** | Defines valid states and transitions | Coordinates workflow execution |
| **Side effects** | **NONE.** Pure logic. | Manages side effects (emit events, write DB) |
| **State mutation** | **NO.** Only validates. | **YES.** Executes approved transitions. |
| **Concurrency** | **NONE.** Stateless. | **YES.** `SELECT ... FOR UPDATE`, locks. |
| **Testability** | Pure unit tests (no DB) | Integration tests (DB + events) |
| **Location** | `core/state-machines/` | `core/orchestrators/` |

```
Event → Orchestrator.readState() → StateMachine.validate()
                                           ↓
                                    Valid/Invalid?
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                     Orchestrator.writeState()   Orchestrator.emitRejection()
                     Orchestrator.emitEvents()
```

---

## Appointment State Machine

### State Definitions

```typescript
type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
type ConfirmationStatus = 'scheduled' | 'completed' | 'confirmed' | 'needs_review' | 'cancelled'

// Combined state = (status, confirmation_status)
type AppointmentState = {
  status: AppointmentStatus
  confirmation_status: ConfirmationStatus
}
```

### Valid Transitions

```typescript
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

### Transition Rules

| From → To | Allowed Events | Conditions |
|---|---|---|
| `(pending, scheduled)` → `(completed, completed)` | `service.completed`, `service.completed_manually` | Actor must be assigned employee or staff+ |
| `(pending, scheduled)` → `(completed, needs_review)` | `service.overdue` | Only emitted by cron detector |
| `(completed, completed)` → `(completed, confirmed)` | `payment.confirmed` | Actor must be staff+ |
| `(pending, scheduled)` → `(cancelled, cancelled)` | `appointment.cancelled` | Allowed for client or staff+ |
| `(completed, completed)` → `(cancelled, cancelled)` | `appointment.cancelled` | Only staff+ (client cannot cancel after service) |
| `(completed, needs_review)` → `(completed, confirmed)` | `payment.confirmed` | Normal reception flow |
| `(completed, needs_review)` → `(completed, completed)` | `service.completed`, `service.completed_manually`, `auto_completion.triggered` | Employee, staff override, or system |
| `(completed, needs_review)` → `(cancelled, cancelled)` | `appointment.cancelled` | Staff+ |

### Transition Validation Function

```typescript
function validateTransition(
  currentState: AppointmentState,
  eventName: string,
  actorRole: DomainActorRole
): TransitionValidation {
  const fromKey = stateKey(currentState.status, currentState.confirmation_status)
  const allowedEvents = VALID_TRANSITIONS[fromKey]

  if (!allowedEvents) {
    return {
      valid: false,
      reason: `No transitions allowed from state ${fromKey}`,
    }
  }

  if (!allowedEvents.has(eventName)) {
    return {
      valid: false,
      reason: `Event ${eventName} not allowed from state ${fromKey}`,
    }
  }

  return { valid: true }
}

function stateKey(status: string, confirmationStatus: string): string {
  return `(${status},${confirmationStatus})`
}

function computeTargetState(eventName: string): Partial<AppointmentState> {
  switch (eventName) {
    case 'service.completed':
    case 'service.completed_manually':
      return { status: 'completed', confirmation_status: 'completed' }
    case 'service.overdue':
      return { confirmation_status: 'needs_review' }
    case 'payment.confirmed':
      return { confirmation_status: 'confirmed' }
    case 'appointment.cancelled':
      return { status: 'cancelled', confirmation_status: 'cancelled' }
    case 'auto_completion.triggered':
      return { status: 'completed', confirmation_status: 'completed' }
    default:
      return {}
  }
}
```

---

## Payroll Period State Machine

### State Definitions

```typescript
type PayrollPeriodStatus = 'draft' | 'approved' | 'finalized' | 'paid' | 'cancelled'
```

### Valid Transitions

| From | To | Allowed Events | Conditions |
|---|---|---|---|
| `draft` | `approved` | `payroll.period_approved` | Admin+ must validate totals |
| `approved` | `finalized` | `payroll.period_finalized` | After all adjustments made |
| `finalized` | `paid` | `payroll.period_paid` | After payment execution |
| `draft` | `cancelled` | `payroll.period_cancelled` | Only if no payments processed |
| `approved` | `draft` | `payroll.period_reopened` | Admin+ for corrections |

### Payroll State Rules

- `draft` → commissions can be added/removed
- `approved` → read-only for commissions, ready for review
- `finalized` → receipt generated, locked for edits
- `paid` → terminal state, payment executed
- `cancelled` → terminal state, period voided

---

## State Machine Properties

| Property | Appointment State Machine | Payroll State Machine |
|---|---|---|
| **Deterministic** | Yes — same input always produces same output | Yes |
| **Side-effect free** | Yes — pure validation logic | Yes |
| **Testable** | Yes — unit test without DB | Yes |
| **Total states** | 8 (status × confirmation_status combinations) | 5 |
| **Terminal states** | `completed+confirmed`, `cancelled`, `no_show+cancelled` | `paid`, `cancelled` |
| **Concurrency model** | Single-writer per aggregate | Single-writer per period |

---

## Navigation

- **Previous:** [Domain Invariants](05-domain-invariants.md)
- **Next:** [Orchestrator Architecture](07-orchestrator-architecture.md)
- **Index:** [README.md](README.md)
