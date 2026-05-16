# Domain Invariants

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [State Ownership](03-state-ownership.md)  
> **Next:** [Transition Authority](04-transition-authority.md)  
> **Index:** [README.md](README.md)

---

## Classification

Domain invariants are classified into two categories:

### HARD Invariants

Violation means **domain corruption**. Data is incorrect, financial records are wrong, or business rules are broken. Must be prevented at all costs.

```
P1: Payment confirmed without valid service completion      → FINANCIAL LOSS
P2: Duplicate payroll entry for same appointment+service    → OVERPAYMENT
P3: Cancelled appointment generates execution events        → FALSE COMMISSION
P4: Completed appointment reverts to pending                → STATE CORRUPTION
P5: no_show with paid/confirmed payment                     → CONTRADICTORY STATE
P6: Confirmation status skips required state                → BROKEN WORKFLOW
P7: Price adjustment after payment confirmed                → REVENUE LEAK
P8: Concurrent writes to appointment state                  → LOST UPDATE
```

### SOFT Operational Tolerances

Violation means **operational degradation**. Notifications are delayed, cache is stale, or UI is behind. Bad but not corrupting.

```
S1: Notification delayed beyond SLA (5 min)                 → POOR UX
S2: Cache is stale (beyond 5s TTL)                         → STALE UI
S3: Realtime misses an event                                → MANUAL REFRESH NEEDED
S4: Notification duplicate sent                             → ANNOYANCE (not corruption)
S5: Payroll processing delayed beyond 1 minute              → ADMIN WAITS
S6: Dead-letter queue grows beyond threshold                → MANUAL REVIEW NEEDED
```

---

## HARD Invariants Catalog

### INV-001: Payment Cannot Exist Without Valid Service Completion

| Property | Value |
|---|---|
| **Risk if broken** | Staff can collect payment for services never rendered. Financial fraud. |
| **Validation point** | AppointmentOrchestrator, `handleTransition()` for `payment.confirmed` |
| **Enforcement** | Orchestrator checks `confirmation_status IN ('completed', 'needs_review')` before allowing transition to `confirmed`. If violated, emits `state_transition.rejected` and returns error. |
| **Consequence** | Rejection: `{ success: false, error: 'No se puede confirmar pago sin servicio completado.' }` |
| **Recovery** | N/A (prevented at validation layer) |

### INV-002: No Duplicate Payroll for Same Appointment+Service

| Property | Value |
|---|---|
| **Risk if broken** | Employee receives double commission for same service. Financial loss. |
| **Validation point** | PayrollListener `addAppointmentToPayroll()`, DB constraint |
| **Enforcement** | `period_commissions` table uses `upsert` with `onConflict: 'payroll_item_id, appointment_id, service_id'` and `ignoreDuplicates: true`. |
| **Consequence** | Duplicate silently ignored. Event `payroll.generated` reports correct count. |
| **Recovery** | Manual reconciliation via dead-letter if needed. |

### INV-003: Cancelled Appointments Must NOT Generate Execution Events

| Property | Value |
|---|---|
| **Risk if broken** | Payroll calculates commission for cancelled appointments. Overpayment. |
| **Validation point** | AppointmentOrchestrator `emitFollowUpEvents()` after cancellation transition |
| **Enforcement** | Cancellation transition emits ONLY `NOTIFICATION_REQUESTED` + `CALENDAR_REFRESH_REQUESTED` + `APPOINTMENT_EXECUTION_COMPLETED`. It NEVER emits `PAYROLL_GENERATION_REQUESTED`. |
| **Consequence** | If violated: duplicate payroll entry. But the orchestrator's state machine prevents this by design. |
| **Recovery** | Verify in dead-letter queue. Remove false payroll entries manually. |

### INV-004: Completed Appointments Must NOT Revert to Pending

| Property | Value |
|---|---|
| **Risk if broken** | Service marked complete can be set back to pending, causing double-processing. |
| **Validation point** | AppointmentOrchestrator transition map. No transition from `(completed,*)` to `(pending,*)` is defined. |
| **Enforcement** | State machine has zero transitions that go backward. All transitions are forward-only. |
| **Consequence** | Orchestrator rejects the transition. `state_transition.rejected` is emitted. |
| **Recovery** | N/A (prevented at state machine layer) |

### INV-005: no_show Must NOT Coexist with Paid/Confirmed Payment

| Property | Value |
|---|---|
| **Risk if broken** | Client marked as no-show but payment was collected. Contradictory business state. |
| **Validation point** | AppointmentOrchestrator, transition handler |
| **Enforcement** | Transition to `no_show` is only valid from states where `confirmation_status != 'confirmed'`. If payment was already confirmed, cancellation must be used instead. |
| **Consequence** | Invalid transition emits `state_transition.rejected`. |
| **Recovery** | Staff must manually handle the conflicting state. |

### INV-006: Notifications Must NEVER Mutate Domain State

| Property | Value |
|---|---|
| **Risk if broken** | Notification system becomes a hidden writer of appointment state. Side effects spiral out of control. |
| **Validation point** | Code review. Architectural enforcement via folder structure (listeners/ directory has no write access to domain tables). |
| **Enforcement** | NotificationListener reads from `appointments` table but only writes to `notification_queue`, `notifications`, `whatsapp_messages`, `email_logs`. |
| **Consequence** | If violated: hidden mutation, no audit trail, orchestrator bypassed. |
| **Recovery** | Manual audit of notification code paths. Restore corrupted state from event log. |

### INV-007: Cron Jobs Must NEVER Mutate State Directly

| Property | Value |
|---|---|
| **Risk if broken** | Cron bypasses orchestrator validation, invariants, and audit. Direct state corruption. This is the current (legacy) problem. |
| **Validation point** | Architecture enforcement. Cron detectors only call `emit()`. They never call `update()` on domain tables. |
| **Enforcement** | Cron detectors are in `core/cron/detectors/`. They only contain detection logic and event emission. Domain write is not imported. |
| **Consequence** | If violated: state changes without orchestration, no audit trail, potential corruption. |
| **Recovery** | Enable feature flag to switch back to orchestrator-routed cron. Repair state from event log. |

### INV-008: Confirmation Status Transitions Must Follow State Machine Order

| Property | Value |
|---|---|
| **Risk if broken** | State can skip required steps (e.g., go from `scheduled` to `confirmed` without `completed`). Payment without service. |
| **Validation point** | AppointmentOrchestrator `VALID_TRANSITIONS` map |
| **Enforcement** | State machine defines exact allowed transitions. Each transition must match the current combined state. |
| **Consequence** | Rejection. Event `state_transition.rejected` is emitted. |
| **Recovery** | N/A (prevented at state machine layer) |

### INV-009: Price Adjustment After Payment Confirmed Must Recalculate Payroll

| Property | Value |
|---|---|
| **Risk if broken** | Price adjusted after payment but payroll still uses old price. Commission wrong. |
| **Validation point** | Orchestrator. If `price.adjusted` arrives after `payment.confirmed`, orchestrator must emit a compensating `PAYROLL_GENERATION_REQUESTED` or update the payroll entry. |
| **Enforcement** | `payment.confirmed` sets terminal state. `price.adjusted` should not be accepted after `payment.confirmed`. If it must be accepted, it triggers payroll recalculation. |
| **Consequence** | Payroll mismatch. Employee over/under paid. |
| **Recovery** | Manual payroll recalculation for affected period. |

### INV-010: Employee Can Only Mark Own Appointments as Completed

| Property | Value |
|---|---|
| **Risk if broken** | Employee can mark another employee's appointment as completed. False commission attribution. |
| **Validation point** | Action layer (`markCompleted.ts`) before emitting `service.completed`. Orchestrator also validates as secondary check. |
| **Enforcement** | `markCompleted.ts` checks `employee.id === appointment.employee_id`. Orchestrator receives employee_id from event and validates match. |
| **Consequence** | Action returns error. Orchestrator emits `state_transition.rejected`. |
| **Recovery** | Staff+ can use `service.completed_manually` with override reason. |

### INV-011: Manual Override Must Always Include Reason

| Property | Value |
|---|---|
| **Risk if broken** | No audit trail for manual interventions. Can't distinguish intentional override from error. |
| **Validation point** | Action layer before emitting override events (`markManually.ts`, `confirmService.ts` for overrides) |
| **Enforcement** | `reason` field is required in `service.completed_manually` and `client.confirmed_manually` events. Zod schema validates non-empty string. |
| **Consequence** | Event emission is rejected at validation layer. |
| **Recovery** | User must retry with reason. |

### INV-012: Confirmed Appointment Must Have Valid Payment Method

| Property | Value |
|---|---|
| **Risk if broken** | Appointment marked as payment confirmed but method is unknown or missing. Financial record incomplete. |
| **Validation point** | Orchestrator transition handler for `payment.confirmed` |
| **Enforcement** | `payment_method` field must be one of: `cash`, `nequi`, `daviplata`, `pse`, `qr`, `card`, `nequi_qr`, `daviplata_qr`, `transfer`. Validated at action layer (Zod schema) and secondary check at orchestrator. |
| **Consequence** | Rejection with `'Método de pago inválido'`. |
| **Recovery** | Staff retries with valid method. |

### INV-013: Payroll Period Must Exist Before Adding Items

| Property | Value |
|---|---|
| **Risk if broken** | Commission entries with no parent period. Orphaned data. |
| **Validation point** | PayrollListener `addAppointmentToPayroll()` |
| **Enforcement** | `payroll_periods` is upserted first. `payroll_items` references `payroll_period_id`. `period_commissions` references `payroll_item_id`. Chain of FK constraints ensures no orphans. |
| **Consequence** | FK constraint violation. Entry fails and goes to dead-letter. |
| **Recovery** | Replay from dead-letter after period is created. |

---

## SOFT Invariants (Operational Tolerances)

| ID | Invariant | Tolerance | Consequence | Owner |
|---|---|---|---|---|
| SFT-001 | Notification delivery within 5 min | 5 minutes average | Poor UX, SLA breach | NotificationListener |
| SFT-002 | Cache staleness under 5 seconds | 5 seconds max | Stale calendar data | CacheInvalidationListener |
| SFT-003 | Realtime event delivery | At-least-once | Manual refresh needed | RealtimeListener |
| SFT-004 | Payroll processing within 1 minute | 1 minute max | Admin waits for receipt | PayrollListener |
| SFT-005 | Dead-letter queue < 100 items | 100 items max | Manual review backlog | Ops team |
| SFT-006 | Cron drift < 30 seconds | 30 seconds | Late reminders/alerts | Cron coordinator |

---

## Invariant Enforcement Summary

| Layer | Enforces | Mechanism |
|---|---|---|
| **Database** | INV-002 (unique constraint), INV-013 (FK constraint) | `UNIQUE`, `REFERENCES`, `CHECK` constraints |
| **State Machine** | INV-004, INV-008 | `VALID_TRANSITIONS` map — only defined transitions allowed |
| **Orchestrator** | INV-001, INV-003, INV-005, INV-012 | `handleTransition()` validates conditions before applying |
| **Action Layer** | INV-010, INV-011 | Zod schema validation + role checks before event emission |
| **Architecture** | INV-006, INV-007 | Folder structure + imports prevent unauthorized writes |
| **Monitoring** | All SOFT invariants | Dashboard alerts when thresholds breached |

---

## Invariant Violation Response

| Violation Type | Response |
|---|---|
| **HARD invariant violated at validation** | Reject transition. Log to `domain_events` with status `failed`. Alert operators. |
| **HARD invariant bypassed (bug/exploit)** | CRITICAL. Freeze affected workflows. Manual state recovery from event log. Root cause analysis required. |
| **SOFT invariant breached** | Monitor and alert. Automatic recovery (retry, revalidate). No domain corruption. Post-mortem for chronic breaches. |

---

## Navigation

- **Previous:** [Transition Authority](04-transition-authority.md)
- **Next:** [State Machines](06-state-machines.md)
- **Index:** [README.md](README.md)
