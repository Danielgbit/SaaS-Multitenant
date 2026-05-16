# DOMAIN MODEL — Appointments v2.0

**Document:** 01-DOMAIN-MODEL.md  
**Status:** Draft for Review  
**Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Backend Architecture  

---

## 1. Overview

This document defines the formal domain model for the Appointment aggregate in Prügressy. It establishes state boundaries, ownership, transition rules, and extension points for future capabilities (deposits, partial completion, reassignment).

**Design Principles:**
- Separation of concerns: Booking lifecycle ≠ Service Execution lifecycle
- State ownership: Each domain owns its state transitions
- Auditability: All state changes are events
- Extensibility: Future capabilities pre-wired without added complexity

---

## 2. Domain Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPOINTMENT AGGREGATE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BOOKING DOMAIN                                                      │   │
│  │  ├─ appointment_id (identity)                                        │   │
│  │  ├─ organization_id                                                 │   │
│  │  ├─ client_id                                                       │   │
│  │  ├─ original_employee_id  ◄─── (changes on reassignment)            │   │
│  │  ├─ current_employee_id   ◄─── (may change over time)              │   │
│  │  ├─ scheduled_start                                                      │   │
│  │  ├─ scheduled_end                                                        │   │
│  │  ├─ booking_status          ◄─── BOOKING OWNED                     │   │
│  │  ├─ booking_source          (dashboard | public_form | walk_in)    │   │
│  │  └─ created_at                                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SERVICE EXECUTION DOMAIN                                           │   │
│  │  ├─ service_lines[]            ◄─── FUTURE: multi-service support   │   │
│  │  ├─ execution_status           ◄─── EXECUTION OWNED                │   │
│  │  ├─ execution_started_at                                           │   │
│  │  ├─ execution_completed_at                                         │   │
│  │  ├─ completion_source           (employee_self | manual | system)  │   │
│  │  └─ client_confirmation_source  (token_link | manual | walk_in)   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PAYMENT DOMAIN                              ◄─── FUTURE           │   │
│  │  ├─ deposit_status              (pending | held | applied | ...)   │   │
│  │  ├─ deposit_amount                                                   │   │
│  │  ├─ payment_status            (pending | collected | refunded)      │   │
│  │  └─ payment_method                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  WORKFLOW FLAGS                                                     │   │
│  │  ├─ needs_review               (60min overdue flag)                  │   │
│  │  ├─ auto_completed             (120min auto trigger)               │   │
│  │  ├─ manual_override_used                                            │   │
│  │  ├─ reminder_sent                                                   │   │
│  │  ├─ payroll_locked                                                  │   │
│  │  └─ audit_metadata: { warnings_acknowledged[], last_override_reason }│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Ownership Principle:**
- `booking_status` → Owned by **Booking Domain**
- `execution_status` → Owned by **Service Execution Domain**
- `payment_status`, `deposit_status` → Owned by **Payment Domain** (future)
- `workflow_flags` → Owned by **Orchestrator** (cross-cutting)

---

## 3. State Enumerations

### 3.1 BookingStatus (IMPLEMENTED)

```typescript
enum BookingStatus {
  /** Appointment is active and expected to occur */
  ACTIVE = 'active',

  /** Client or staff cancelled the appointment */
  CANCELLED = 'cancelled',

  /** Client did not show up */
  NO_SHOW = 'no_show',
}
```

**Status: IMPLEMENTED**

**Transitions:**
```
ACTIVE ──[appointment_cancelled]──▶ CANCELLED
ACTIVE ──[no_show_marked]────────▶ NO_SHOW
```

**Invariant:** Once CANCELLED or NO_SHOW, NEVER transitions back to ACTIVE.

---

### 3.2 ServiceExecutionStatus (IMPLEMENTED with extension points)

```typescript
enum ServiceExecutionStatus {
  /** Initial state: Scheduled but not yet performed */
  SCHEDULED = 'scheduled',

  /** Employee marked service as performed ("Listo") */
  MARKED_COMPLETE = 'marked_complete',

  /** Staff/Admin manually marked complete (with reason/warning) */
  MARKED_COMPLETE_MANUALLY = 'marked_complete_manually',

  /** System auto-completed after 120min in NEEDS_REVIEW */
  AUTO_COMPLETED = 'auto_completed',

  /** Service confirmed + payment collected */
  CONFIRMED = 'confirmed',
}
```

**Status: IMPLEMENTED**

**Extension Point (PLANNED):** `PARTIAL_COMPLETION`
```typescript
// FUTURE: When multi-service line items are supported
// ServiceExecutionStatus will extend to include:
// PARTIALLY_COMPLETED = 'partially_completed'
// Where individual service_lines have their own completion states
```

**Transitions:**

| From | Event | To | Actor | Reason Required |
|------|-------|----|-------|-----------------|
| SCHEDULED | `service_completed` | MARKED_COMPLETE | Employee (own) | No |
| SCHEDULED | `manual_completion_requested` | MARKED_COMPLETE_MANUALLY | Staff/Admin/Owner | Yes |
| SCHEDULED | `needs_review_triggered` (60min) | NEEDS_REVIEW | System (Cron) | No |
| MARKED_COMPLETE | `payment_confirmed` | CONFIRMED | Staff/Admin/Owner | No |
| MARKED_COMPLETE_MANUALLY | `payment_confirmed` | CONFIRMED | Staff/Admin/Owner | No |
| NEEDS_REVIEW | `manual_completion_requested` | MARKED_COMPLETE_MANUALLY | Staff/Admin/Owner | Yes |
| NEEDS_REVIEW | `auto_completion_triggered` (120min) | AUTO_COMPLETED | System (Cron) | No |
| NEEDS_REVIEW | `no_show_marked` | NO_SHOW | Staff/Admin/Owner | Yes |
| AUTO_COMPLETED | `payment_confirmed` | CONFIRMED | Staff/Admin/Owner | No |
| AUTO_COMPLETED | `no_show_marked` | NO_SHOW | Staff/Admin/Owner | Yes |

**Note:** NEEDS_REVIEW is a transient state managed by the system, not stored as a persistent status. It exists only in the transition logic.

---

### 3.3 PaymentStatus (PLANNED — extension point)

```typescript
enum PaymentStatus {
  /** No payment collected yet */
  PENDING = 'pending',

  /** Payment confirmed (cash, card, transfer) */
  COLLECTED = 'collected',

  /** Payment reversed/refunded */
  REFUNDED = 'refunded',

  /** Partial refund applied */
  PARTIAL_REFUND = 'partial_refund',
}
```

**Status: PLANNED (not currently implemented)**

**Extension Rationale:** Current system conflates payment with confirmation. Future separation allows:
- Deposit management
- Partial refunds
- No-show penalties
- Refund policies per service

---

### 3.4 DepositStatus (PLANNED — extension point)

```typescript
enum DepositStatus {
  /** Deposit requested but not yet paid */
  PENDING = 'deposit_pending',

  /** Deposit paid and held */
  HELD = 'deposit_held',

  /** Deposit applied toward payment */
  APPLIED = 'deposit_applied',

  /** Partial refund issued */
  PARTIAL_REFUND = 'deposit_partial_refund',

  /** Deposit forfeited due to no-show/cancellation */
  FORFEITED = 'deposit_forfeited',

  /** Full refund issued */
  FULL_REFUND = 'deposit_full_refund',
}
```

**Status: PLANNED (not currently implemented)**

**Extension Rationale:** Deposit support requires financial policies, refund logic, and penalty handling.

---

### 3.5 ClientConfirmationSource (IMPLEMENTED)

```typescript
enum ClientConfirmationSource {
  /** Client confirmed via email/SMS token link */
  TOKEN_LINK = 'token_link',

  /** Staff/Admin confirmed manually on behalf of client */
  MANUAL_OVERRIDE = 'manual_override',

  /** Walk-in: client confirmed by appearing */
  WALK_IN = 'walk_in',

  /** System auto-confirmed after configurable timeout */
  AUTO_CONFIRMED = 'auto_confirmed',
}
```

**Status: IMPLEMENTED**

---

### 3.6 CompletionSource (IMPLEMENTED)

```typescript
enum CompletionSource {
  /** Employee tapped "Listo" themselves */
  EMPLOYEE_SELF = 'employee_self',

  /** Owner/Admin/Staff marked complete manually */
  MANUAL_STAFF_OVERRIDE = 'manual_staff_override',

  /** System auto-completed after timeout */
  SYSTEM_AUTO = 'system_auto',
}
```

**Status: IMPLEMENTED**

---

### 3.7 BookingSource (IMPLEMENTED)

```typescript
enum BookingSource {
  /** Created from staff dashboard */
  DASHBOARD = 'dashboard',

  /** Created from public booking form */
  PUBLIC_FORM = 'public_form',

  /** Walk-in without prior booking */
  WALK_IN = 'walk_in',
}
```

**Status: IMPLEMENTED**

---

## 4. Transition State Machine

### 4.1 Service Execution State Diagram

```
                              ┌──────────────────────────────────────────────────────┐
                              │                      SCHEDULED                       │
                              │              (Employee hasn't marked "Listo")          │
                              │                                                      │
                              │   ┌────────────────────────────────────────────┐     │
                              │   │ 1. Employee marks "Listo"                 │     │
                              │   │ 2. Staff manual override                 │     │
                              │   │ 3. System triggers needs_review (60min) │     │
                              │   └────────────────────────────────────────────┘     │
                              └──────────────────────┬───────────────────────────────┘
                                                     │
                         ┌───────────────────────────┼───────────────────────────────┐
                         │                           │                               │
                         ▼                           ▼                               │
              ┌──────────────────────┐    ┌─────────────────────┐                  │
              │   MARKED_COMPLETE    │    │     NEEDS_REVIEW    │                  │
              │   (Employee Self)    │    │   (Transient State) │                  │
              └──────────┬───────────┘    └──────────┬──────────┘                  │
                         │                          │                                │
                         │                          │ ┌────────────────────────────┐ │
                         │                          │ │ Manual override            │ │
                         │                          │ │ (requires reason + warning)│ │
                         │                          ▼ ▼                            │ │
                         │                 ┌──────────────────────┐                │ │
                         │                 │ MARKED_COMPLETE     │                │ │
                         │                 │ MANUALLY            │                │ │
                         │                 └──────────┬───────────┘                │ │
                         │                            │                             │ │
                         │                            └─────────────────────────────┘ │
                         │                                                             │
                         │                          ┌────────────────────────────┐    │
                         │                          │ Auto-complete triggered    │    │
                         │                          │ (120min, system only)     │    │
                         │                          ▼                            │ │
                         │                 ┌──────────────────────┐                │ │
                         │                 │    AUTO_COMPLETED   │                │ │
                         │                 └──────────┬───────────┘                │ │
                         │                            │                             │ │
                         │                            │                             │ │
                         └────────────────────────────┼─────────────────────────────┘ │
                                                   │                                   │
                                                   │ Payment confirmed                  │
                                                   │ (cash/card/transfer)              │
                                                   ▼                                   │
                                        ┌──────────────────────┐                      │
                                        │      CONFIRMED        │                      │
                                        │  (Payment Collected)  │                      │
                                        └──────────────────────┘                      │
                                                                                     │
                           ══════════════════════════════════════════════════════════
                                                                                     │
                           NO_SHOW ◀────────── NEEDS_REVIEW                         │
                                        │                                            │
                           (Staff marks │                                            │
                            no-show)    │                                            │
                           ══════════════════════════════════════════════════════════
```

### 4.2 Booking Status State Diagram

```
                         ┌─────────────┐
                         │   ACTIVE    │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              │  appointment_   │  no_show_       │ (Future)
              │  cancelled     │  marked         │
              ▼                 ▼                 │
       ┌────────────┐    ┌────────────┐           │
       │ CANCELLED  │    │  NO_SHOW   │           │
       └────────────┘    └────────────┘           │
                                                                 │
                           ════════════════════════════════════════════════════════

       Note: CANCELLED and NO_SHOW are terminal states.
       The appointment record is preserved for audit but no further
       execution transitions are allowed.
```

### 4.3 Complete Transition Table

| Current State | Event | Next State | Actor | Reason Required | Warning |
|--------------|-------|------------|-------|-----------------|---------|
| SCHEDULED | `service_completed` | MARKED_COMPLETE | Employee (own) | No | No |
| SCHEDULED | `manual_completion_requested` | MARKED_COMPLETE_MANUALLY | Staff/Admin/Owner | Yes | Yes |
| SCHEDULED | `needs_review_triggered` | (transient) | System | No | No |
| MARKED_COMPLETE | `payment_confirmed` | CONFIRMED | Staff/Admin/Owner | No | No |
| MARKED_COMPLETE_MANUALLY | `payment_confirmed` | CONFIRMED | Staff/Admin/Owner | No | No |
| MARKED_COMPLETE | `cancellation_requested` | CANCELLED | Client/Staff | Yes (staff) | No |
| NEEDS_REVIEW | `manual_completion_requested` | MARKED_COMPLETE_MANUALLY | Staff/Admin/Owner | Yes | Yes |
| NEEDS_REVIEW | `auto_completion_triggered` | AUTO_COMPLETED | System | No | No |
| NEEDS_REVIEW | `no_show_marked` | NO_SHOW | Staff/Admin/Owner | Yes | No |
| NEEDS_REVIEW | `cancellation_requested` | CANCELLED | Client/Staff | Yes (staff) | No |
| AUTO_COMPLETED | `payment_confirmed` | CONFIRMED | Staff/Admin/Owner | No | No |
| AUTO_COMPLETED | `no_show_marked` | NO_SHOW | Staff/Admin/Owner | Yes | No |
| AUTO_COMPLETED | `cancellation_requested` | CANCELLED | Client/Staff | Yes (staff) | No |
| CONFIRMED | `refund_requested` | REFUNDED | Admin/Owner | Yes | Yes |
| ACTIVE | `appointment_cancelled` | CANCELLED | Client/Staff/Owner | Yes (staff) | No |
| ACTIVE | `no_show_marked` | NO_SHOW | Staff/Admin/Owner | Yes | No |

### 4.4 Invalid (Forbidden) Transitions

| Current State | Attempted Event | Reason |
|--------------|-----------------|--------|
| CONFIRMED | `service_completed` | Already completed |
| CONFIRMED | `auto_completion_triggered` | Already completed |
| CANCELLED | `service_completed` | Appointment cancelled |
| CANCELLED | `payment_confirmed` | Cannot pay cancelled |
| NO_SHOW | `service_completed` | Client was no-show |
| NO_SHOW | `payment_confirmed` | Cannot collect from no-show |

---

## 5. Extension Points

### 5.1 Multi-Service Line Items (PLANNED)

**Current:** Single service per appointment (or all services completed together)

**Future Model:**
```typescript
interface ServiceLineItem {
  id: UUID;
  serviceId: UUID;
  employeeId: UUID;
  status: 'pending' | 'completed' | 'skipped' | 'no_show';
  price: Decimal;
  commissionRate: Decimal;
  completedAt: TIMESTAMPTZ | null;
  completedBy: UUID | null;
}
```

**Impact:**
- `execution_status` becomes derived from line items
- Individual lines can be completed independently
- Payroll calculation uses completed lines only

**Transition Extension:**
```typescript
// When line items are introduced:
PARTIALLY_COMPLETED = 'partially_completed'  // At least one line complete, not all
```

---

### 5.2 Employee Reassignment (PLANNED)

**Current:** No formal reassignment workflow

**Future Model:**
```typescript
interface ReassignmentEvent {
  appointmentId: UUID;
  previousEmployeeId: UUID;
  newEmployeeId: UUID;
  reason: string;
  performedBy: UUID;
  payrollImpact: 'recalculate' | 'pending_review' | 'none';
  clientNotified: boolean;
}
```

**Transition:**
```
current_employee_id changes ──▶ ReassignmentEvent emitted ──▶
  ├─ Payroll recalculation triggered
  ├─ New employee notified
  └─ Audit trail updated
```

---

### 5.3 Deposit Integration (PLANNED)

**Current:** No deposit support

**Future Model:**
```typescript
interface DepositPolicy {
  organizationId: UUID;
  serviceId: UUID | null;      // null = all services
  amount: Decimal;             // Fixed or percentage
  required: boolean;
  refundableUntil: Duration;   // e.g., 24 hours before
  forfeiturePolicy: 'full' | 'partial' | 'none';
}

interface Deposit {
  id: UUID;
  appointmentId: UUID;
  amount: Decimal;
  status: DepositStatus;
  paidAt: TIMESTAMPTZ | null;
  refundedAt: TIMESTAMPTZ | null;
  refundAmount: Decimal | null;
}
```

**Integration Points:**
- `appointment_cancelled` → Check deposit policy, apply forfeiture or refund
- `no_show_marked` → Apply deposit forfeiture if configured
- `payment_confirmed` → Apply deposit toward payment

---

### 5.4 Rescheduling (PLANNED)

**Current:** No formal rescheduling — depends on implementation of updateAppointment

**Future Model:**
```typescript
interface ReschedulingEvent {
  appointmentId: UUID;
  previousStartTime: TIMESTAMPTZ;
  newStartTime: TIMESTAMPTZ;
  reason: string;
  preserveConfirmation: boolean;
  depositAction: 'transfer' | 'forfeit' | 'none';
  payrollAction: 'reverse' | 'mark_pending' | 'none';
  notificationResend: boolean;
}
```

**Transition:**
```
UPDATE appointment.start_time ──▶ ReschedulingEvent emitted ──▶
  ├─ Reminders invalidated
  ├─ Availability recalculated
  ├─ Confirmations potentially invalidated
  ├─ Payroll adjusted if applicable
  └─ Notifications regenerated
```

---

## 6. Ownership Boundaries

### 6.1 Domain Ownership Matrix

| Domain | State Fields | Commands | Events Produced |
|--------|-------------|----------|-----------------|
| **Booking** | `booking_status`, `scheduled_start`, `scheduled_end`, `client_id`, `employee_id` | `create_appointment`, `cancel_appointment`, `reschedule_appointment` | `APPOINTMENT_CREATED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_RESCHEDULED` |
| **Service Execution** | `execution_status`, `completion_source`, `client_confirmation_source`, `service_lines[]` | `complete_service`, `mark_manually`, `mark_no_show` | `SERVICE_COMPLETED`, `SERVICE_COMPLETED_MANUALLY`, `NO_SHOW_MARKED`, `NEEDS_REVIEW_TRIGGERED`, `AUTO_COMPLETION_TRIGGERED` |
| **Payment** | `payment_status`, `deposit_status`, `payment_method`, `amount` | `collect_payment`, `refund_payment`, `request_deposit` | `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED`, `DEPOSIT_REQUESTED`, `DEPOSIT_PAID`, `DEPOSIT_FORFEITED` |
| **Payroll** | `payroll_locked`, `payroll_item_id` | `lock_for_payroll`, `reverse_payroll` | `ADDED_TO_PAYROLL`, `PAYROLL_REVERSED` |
| **Orchestrator** | `workflow_flags` | (all transitions go through orchestrator) | (all events) |

### 6.2 State Modification Authority

| State | Who Can Modify | Enforcement |
|-------|----------------|-------------|
| `booking_status` | Booking Domain + Orchestrator | Only via `APPOINTMENT_CANCELLED`, `NO_SHOW_MARKED` events |
| `execution_status` | Execution Domain + Orchestrator | Only via defined transition events |
| `payment_status` | Payment Domain (future) | Only via `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED` |
| `workflow_flags` | Orchestrator exclusively | Flags set by event handlers, never directly |

---

## 7. Workflow Flags

```typescript
interface WorkflowFlags {
  /** Reminder notification was sent to employee */
  reminderSent: boolean;

  /** Appointment flagged as needs review (60min overdue) */
  needsReview: boolean;

  /** System auto-completed after 120min timeout */
  autoCompleted: boolean;

  /** At least one manual override was performed */
  manualOverrideUsed: boolean;

  /** Warning was acknowledged before last action */
  warningAcknowledged: boolean;

  /** Appointment locked for payroll processing */
  payrollLocked: boolean;

  /** All warnings acknowledged in this appointment lifecycle */
  allWarningsAcknowledged: boolean[];

  /** Last override reason provided */
  lastOverrideReason: string | null;
}
```

**Invariant:** `workflow_flags` are append-only metadata. They are never deleted, only set to true.

---

## 8. Current vs New Model Mapping

### 8.1 Legacy State Mapping

| Legacy Field | Legacy Value | New Model Equivalent |
|--------------|--------------|----------------------|
| `appointments.status = 'pending'` | Initial | `booking_status = ACTIVE` |
| `appointments.status = 'confirmed'` | Active booking | `booking_status = ACTIVE` |
| `appointments.status = 'completed'` | Legacy completion | See below |
| `appointments.status = 'canceled'` | Cancelled | `booking_status = CANCELLED` |
| `appointments.status = 'no_show'` | No-show | `booking_status = NO_SHOW` |
| `appointments.confirmation_status = 'scheduled'` | Awaiting execution | `execution_status = SCHEDULED` |
| `appointments.confirmation_status = 'completed'` | Employee marked "Listo" | `execution_status = MARKED_COMPLETE` |
| `appointments.confirmation_status = 'confirmed'` | Payment collected | `execution_status = CONFIRMED` |
| `appointments.confirmation_status = 'needs_review'` | 60min overdue | `flags.needsReview = true` (transient) |
| `appointments.confirmation_status = 'pending_confirmation'` | Awaiting client | `clientConfirmationSource = TOKEN_LINK` (pending) |

### 8.2 Deprecation Notes

| Old Concept | Replacement | Notes |
|-------------|-------------|-------|
| `confirmation_status = 'confirmed'` meaning "paid" | `execution_status = CONFIRMED` + `payment_status = COLLECTED` | Clarifies semantic confusion |
| `status = 'completed'` ambiguous | `execution_status = AUTO_COMPLETED` or `MARKED_COMPLETE` or `CONFIRMED` | Precise state tracking |
| `needs_review` as status value | `flags.needsReview = true` + NEEDS_REVIEW transient state | Proper state machine |

---

## 9. Invariants and Business Rules

### 9.1 Core Invariants

1. **No regression:** Execution status never goes backward (SCHEDULED → CONFIRMED only, never reverse unless cancellation)

2. **No orphan execution:** An appointment cannot be CONFIRMED without going through at least SCHEDULED → MARKED_COMPLETE or equivalent

3. **Cancellation clears pending:** When `booking_status = CANCELLED`, no further execution events are processed

4. **No-show terminal:** When `booking_status = NO_SHOW`, execution stops but record is preserved

5. **Manual override audit:** Any override must record reason, actor, timestamp, and warning acknowledgment

6. **Source tracking:** Every state change must record WHO did it (actor), WHAT system (source), and WHY if override

### 9.2 Business Rules

| Rule | Description |
|------|-------------|
| BR-001 | Only Owner, Admin, or Staff can mark manual completion |
| BR-002 | Only Owner, Admin, or Staff can confirm payment |
| BR-003 | Only Owner, Admin, or Staff can mark no-show |
| BR-004 | Client can only cancel their own appointments |
| BR-005 | Manual completion requires reason ≥ 10 characters |
| BR-006 | Manual completion requires warning acknowledgment |
| BR-007 | Auto-completion only triggers from NEEDS_REVIEW state |
| BR-008 | Needs-review only triggers 60 minutes after scheduled end_time |
| BR-009 | Payment cannot be collected from cancelled or no-show appointments |
| BR-010 | Once payroll_locked = true, no execution changes allowed without payroll reversal |

---

## 10. Appendix: State Summary Table

### 10.1 All States by Status

| State | Type | Terminal? | Actors | Extension |
|-------|------|-----------|--------|-----------|
| ACTIVE | Booking | No | System | — |
| CANCELLED | Booking | Yes | Client, Staff, Admin, Owner | — |
| NO_SHOW | Booking | Yes | Staff, Admin, Owner | — |
| SCHEDULED | Execution | No | Employee, Staff, Admin, Owner, System | — |
| MARKED_COMPLETE | Execution | No | Employee | — |
| MARKED_COMPLETE_MANUALLY | Execution | No | Staff, Admin, Owner | — |
| AUTO_COMPLETED | Execution | No | System | — |
| CONFIRMED | Execution | Yes | Staff, Admin, Owner | — |
| PENDING | Payment | No | — | PLANNED |
| COLLECTED | Payment | Yes | Staff, Admin, Owner | PLANNED |
| REFUNDED | Payment | Yes | Admin, Owner | PLANNED |

### 10.2 State Count

| Category | Count | Implemented |
|----------|-------|-------------|
| Booking States | 3 | 3 |
| Execution States | 5 | 5 |
| Payment States | 3 | 0 (PLANNED) |
| Deposit States | 6 | 0 (PLANNED) |
| **Total** | **23** | **11 (47%)** |

---

**END OF DOCUMENT**