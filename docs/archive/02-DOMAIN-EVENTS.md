> **STATUS: LEGACY / ARCHIVED**
> Este documento se mantiene como referencia hist�rica.
> Su contenido puede estar desactualizado. Ver docs/INDEX.md para la documentaci�n vigente.
> ---

# DOMAIN EVENTS — Appointments v2.0

**Document:** 02-DOMAIN-EVENTS.md  
**Status:** Draft for Review  
**Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Backend Architecture  

---

## 1. Overview

This document defines the complete domain event catalog for the Appointment aggregate. Every state change is expressed as an immutable event. Events are the only source of truth for state transitions.

**Design Principles:**
- **Immutability:** Events are never modified after emission
- **Traceability:** Every event carries actor, timestamp, source, and correlation IDs
- **Versioning:** Event schemas are versioned for forward compatibility
- **Implementation Tracking:** Events are marked as IMPLEMENTED or PLANNED

---

## 2. Event Envelope

All domain events share a common envelope structure:

```typescript
interface DomainEventEnvelope<T = unknown> {
  /** Unique identifier for this specific event occurrence */
  eventId: UUID;

  /** Type identifier for event schema versioning */
  eventType: EventType;

  /** Aggregates related events (e.g., all events for one appointment) */
  correlationId: UUID;

  /** The specific event that caused this one (causality chain) */
  causationId: UUID | null;

  /** Timestamp when event was created */
  timestamp: ISO8601;

  /** Source of the event (who/what emitted it) */
  source: EventSource;

  /** Version of the event schema */
  version: string;

  /** The event-specific payload */
  payload: T;

  /** Cross-cutting metadata (actor, device, IP, etc.) */
  metadata: EventMetadata;
}

type EventType = string;  // e.g., "SERVICE_COMPLETED", "PAYMENT_CONFIRMED"

type EventSource = 'employee_self' | 'manual_staff_override' | 'system_auto' | 'legacy_adapter' | 'manual';

interface EventMetadata {
  actorId: UUID | null;
  actorRole: Role | null;
  organizationId: UUID;
  appointmentId: UUID;
  ipAddress: string | null;
  userAgent: string | null;
  cronRunId: UUID | null;
}
```

---

## 3. Event Catalog

### 3.1 APPOINTMENT_CREATED

**Status:** IMPLEMENTED  
**Domain:** Booking  
**Purpose:** Emitted when a new appointment is scheduled

```typescript
interface AppointmentCreatedPayload {
  organizationId: UUID;
  clientId: UUID;
  employeeId: UUID;
  serviceIds: UUID[];
  scheduledStart: ISO8601;
  scheduledEnd: ISO8601;
  bookingSource: BookingSource;
  notes: string | null;
  clientConfirmationRequired: boolean;
  clientConfirmationDeadline: ISO8601 | null;
}

interface AppointmentCreatedMetadata extends EventMetadata {
  requestedSlotId: UUID | null;  // If from slot selection
}
```

| Field | Description |
|-------|-------------|
| `clientConfirmationDeadline` | When client must confirm (null if not required) |

**Emitted By:** `createAppointment` action  
**Consumed By:**
- Notification Orchestrator → sends new booking notification to employee
- Calendar Service → updates availability

---

### 3.2 SERVICE_COMPLETED

**Status:** IMPLEMENTED  
**Domain:** Service Execution  
**Purpose:** Employee marked service as performed ("Listo")

```typescript
interface ServiceCompletedPayload {
  serviceIds: UUID[];         // Which services were completed
  notes: string | null;
  executionTimeMinutes: number;  // Minutes from scheduled end_time
  priceAdjustments: PriceAdjustment[];
}

interface PriceAdjustment {
  serviceId: UUID;
  originalPrice: Decimal;
  adjustedPrice: Decimal;
  reason: string | null;
}

interface ServiceCompletedMetadata extends EventMetadata {
  source: 'employee_self';
  deviceInfo: string | null;
  markCompleteLatencyMs: number;  // Time from scheduled end to marking
}
```

| Field | Description |
|-------|-------------|
| `executionTimeMinutes` | Negative if marked early, positive if late |
| `priceAdjustments` | Any inline price changes at time of completion |

**Emitted By:** `markCompleted` action  
**Consumed By:**
- Notification Orchestrator → sends "service ready" to assistants
- Payroll Service → queues appointment for commission calculation

---

### 3.3 SERVICE_COMPLETED_MANUALLY

**Status:** IMPLEMENTED  
**Domain:** Service Execution  
**Purpose:** Staff/Admin manually marked service complete (override)

```typescript
interface ServiceCompletedManuallyPayload {
  serviceIds: UUID[];
  reason: string;           // REQUIRED, min 10 chars
  warningAcknowledged: boolean;
  warningType: WarningType;
  originalEndTime: ISO8601;
  notes: string | null;
}

type WarningType =
  | 'payroll_impact'
  | 'client_not_confirmed'
  | 'employee_not_available'
  | 'other';

interface ServiceCompletedManuallyMetadata extends EventMetadata {
  source: 'manual_staff_override';
  previousExecutionStatus: ServiceExecutionStatus;
  warningsShown: WarningType[];
}
```

**Business Rules:**
- `reason` MUST be ≥ 10 characters
- `warningAcknowledged` MUST be `true`
- Actor MUST be Staff, Admin, or Owner

**Emitted By:** `markManually` action → through orchestrator  
**Consumed By:**
- Notification Orchestrator → sends "manual completion" alert to admin
- Audit Logger → records override with full context
- Payroll Service → marks as manual completion for review

---

### 3.4 PAYMENT_CONFIRMED

**Status:** IMPLEMENTED  
**Domain:** Payment  
**Purpose:** Payment collected and appointment confirmed

```typescript
interface PaymentConfirmedPayload {
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  amount: Decimal;
  currency: 'COP';
  notes: string | null;
  serviceIds: UUID[];
  tipAmount: Decimal | null;  // FUTURE: separate tip tracking
}

interface PaymentConfirmedMetadata extends EventMetadata {
  source: 'manual_staff_override';
  cashDrawerId: UUID | null;  // If using cash drawer tracking
}
```

**Side Effects:**
- `execution_status` → CONFIRMED
- `payment_status` → COLLECTED (future)
- Payroll item generated
- Confirmation notification sent to employee

**Emitted By:** `confirmService` action  
**Consumed By:**
- Notification Orchestrator → sends confirmation to employee
- Payroll Service → creates commission record
- Realtime → updates appointment UI

---

### 3.5 CLIENT_CONFIRMED

**Status:** IMPLEMENTED  
**Domain:** Booking  
**Purpose:** Client confirmed appointment via token link

```typescript
interface ClientConfirmedPayload {
  confirmationMethod: 'token_link' | 'auto_confirmed' | 'walk_in';
  tokenId: UUID | null;
  reminderCount: number;
  lastReminderSentAt: ISO8601 | null;
  confirmationLatencyMs: number;  // Time from token sent to confirmed
}

interface ClientConfirmedMetadata extends EventMetadata {
  actorId: null;  // Client is not authenticated user
  clientEmail: string;
  clientPhone: string | null;
}
```

**Emitted By:** `ConfirmToken` route/handler  
**Consumed By:**
- Appointment Orchestrator → updates `client_confirmation_source`
- Notification Orchestrator → may cancel pending reminders

---

### 3.6 CLIENT_CONFIRMED_MANUALLY

**Status:** IMPLEMENTED  
**Domain:** Booking  
**Purpose:** Staff confirmed client attendance manually (override)

```typescript
interface ClientConfirmedManuallyPayload {
  reason: string;           // REQUIRED
  warningAcknowledged: boolean;
  clientContactedAttempts: number;
  lastContactAttempt: ISO8601 | null;
  confirmationType: 'staff_override' | 'client_no_response';
}

interface ClientConfirmedManuallyMetadata extends EventMetadata {
  source: 'manual_staff_override';
  previousConfirmationStatus: ClientConfirmationSource | null;
}
```

**Business Rules:**
- `reason` MUST be ≥ 10 characters
- `warningAcknowledged` MUST be `true`
- Actor MUST be Staff, Admin, or Owner

**Emitted By:** Manual confirmation flow through orchestrator  
**Consumed By:**
- Audit Logger → records override with reason
- Notification Orchestrator → alerts admin of manual confirmation

---

### 3.7 NEEDS_REVIEW_TRIGGERED

**Status:** IMPLEMENTED  
**Domain:** Service Execution (System)  
**Purpose:** System detected appointment overdue 60 minutes without completion

```typescript
interface NeedsReviewTriggeredPayload {
  originalEndTime: ISO8601;
  overdueMinutes: number;
  reminderCountBefore: number;
  lastReminderSentAt: ISO8601 | null;
  detectionTime: ISO8601;
}

interface NeedsReviewTriggeredMetadata extends EventMetadata {
  source: 'system_auto';
  cronRunId: UUID;
  cronClusterId: string;
  detectorVersion: string;
}
```

**Note:** This is a system-detected condition, not an appointment state. The orchestrator receives this event and may transition the appointment to a needs_review flag/condition.

**Emitted By:** Cron detector (NOT directly mutating state)  
**Consumed By:**
- Appointment Orchestrator → may set `flags.needsReview = true`
- Notification Orchestrator → sends "unmarked alert" to assistants

---

### 3.8 AUTO_COMPLETION_TRIGGERED

**Status:** IMPLEMENTED  
**Domain:** Service Execution (System)  
**Purpose:** System auto-completed appointment after 120 minutes in needs_review

```typescript
interface AutoCompletionTriggeredPayload {
  originalEndTime: ISO8601;
  autoCompleteTime: ISO8601;
  overdueMinutes: number;
  needsReviewDurationMinutes: number;
  notifySent: boolean;
  serviceIds: UUID[];
}

interface AutoCompletionTriggeredMetadata extends EventMetadata {
  source: 'system_auto';
  cronRunId: UUID;
  cronClusterId: string;
}
```

**Side Effects:**
- `execution_status` → AUTO_COMPLETED
- `flags.autoCompleted = true`
- `completion_source` → SYSTEM_AUTO
- Payroll item generated (system-completed flag)
- Notification sent to staff

**Emitted By:** Cron detector  
**Consumed By:**
- Appointment Orchestrator → applies state transition
- Notification Orchestrator → sends "auto-completed" to assistants
- Payroll Service → creates commission with "system_auto" flag

---

### 3.9 NO_SHOW_MARKED

**Status:** IMPLEMENTED  
**Domain:** Booking + Service Execution  
**Purpose:** Staff marked client as no-show

```typescript
interface NoShowMarkedPayload {
  reason: string;           // REQUIRED
  notificationSent: boolean;
  notificationFailedReason: string | null;
  penaltyApplied: boolean;     // FUTURE: deposit forfeiture
  penaltyAmount: Decimal | null;
}

interface NoShowMarkedMetadata extends EventMetadata {
  source: 'manual_staff_override';
  markedByRole: 'staff' | 'admin' | 'owner';
}
```

**Side Effects:**
- `booking_status` → NO_SHOW
- `execution_status` → NO_SHOW (if not yet confirmed)
- Payroll impact if service was completed (reversal or mark pending)
- Deposit forfeiture if configured (FUTURE)

**Emitted By:** No-show marking flow through orchestrator  
**Consumed By:**
- Notification Orchestrator → notifies employee
- Payroll Service → reverses or marks pending commission
- Audit Logger → records no-show

---

### 3.10 APPOINTMENT_CANCELLED

**Status:** IMPLEMENTED  
**Domain:** Booking  
**Purpose:** Appointment cancelled by client or staff

```typescript
interface AppointmentCancelledPayload {
  reason: string | null;         // Optional for client, required for staff
  cancellationType: 'client_request' | 'staff_cancellation' | 'system_cancellation' | 'reschedule';
  cancelledBy: 'client' | Role;
  refundEligible: boolean;
  refundAmount: Decimal | null;   // FUTURE: deposit refund
  servicesCount: number;
  depositAction: 'none' | 'refund' | 'forfeit' | 'transfer';  // FUTURE
  appointmentSource: BookingSource;
}

interface AppointmentCancelledMetadata extends EventMetadata {
  source: 'manual' | 'client' | 'system_auto';
  daysBeforeAppointment: number;
  cancellationWindow: 'free' | 'partial' | 'non_refundable';
}
```

**Business Rules:**
- If cancelled by staff, `reason` is REQUIRED
- Cancellation type affects deposit handling (FUTURE)
- Notification sent to employee and client

**Emitted By:** `cancelAppointment` action  
**Consumed By:**
- Notification Orchestrator → sends cancellation notice
- Payroll Service → reverses any pending payroll
- Calendar Service → frees up slot

---

### 3.11 PAYMENT_REFUNDED (PLANNED)

**Status:** PLANNED  
**Domain:** Payment  
**Purpose:** Payment was refunded (full or partial)

```typescript
interface PaymentRefundedPayload {
  originalPaymentId: UUID;
  refundAmount: Decimal;
  refundType: 'full' | 'partial';
  reason: string;              // REQUIRED
  refundMethod: 'original' | 'credit' | 'cash';
  refundedBy: UUID;
}

interface PaymentRefundedMetadata extends EventMetadata {
  source: 'manual_staff_override';
  previousPaymentStatus: PaymentStatus;
  commissionReversed: boolean;
  commissionReversedAmount: Decimal | null;
}
```

**Side Effects:**
- `payment_status` → REFUNDED or PARTIAL_REFUND
- Payroll reversal triggered
- Audit record for financial compliance

**Emitted By:** Refund flow through orchestrator (future)  
**Consumed By:**
- Payroll Service → reverses commission
- Notification Orchestrator → notifies client
- Audit Logger → financial record

---

### 3.12 DEPOSIT_REQUESTED (PLANNED)

**Status:** PLANNED  
**Domain:** Payment  
**Purpose:** Deposit requested for appointment

```typescript
interface DepositRequestedPayload {
  depositId: UUID;
  amount: Decimal;
  currency: 'COP';
  policyId: UUID;
  serviceIds: UUID[];
  paymentMethodRequested: 'card' | 'transfer' | 'cash';
  validUntil: ISO8601;
}

interface DepositRequestedMetadata extends EventMetadata {
  source: 'system_auto';  // or 'manual' if staff initiates
  depositPolicyName: string;
  refundableUntil: ISO8601;
}
```

---

### 3.13 DEPOSIT_PAID (PLANNED)

**Status:** PLANNED  
**Domain:** Payment  
**Purpose:** Deposit payment received

```typescript
interface DepositPaidPayload {
  depositId: UUID;
  amount: Decimal;
  paymentMethod: 'card' | 'transfer' | 'cash';
  transactionId: string;
}
```

---

### 3.14 DEPOSIT_FORFEITED (PLANNED)

**Status:** PLANNED  
**Domain:** Payment  
**Purpose:** Deposit retained due to no-show or late cancellation

```typescript
interface DepositForfeitedPayload {
  depositId: UUID;
  amount: Decimal;
  forfeitureReason: 'no_show' | 'late_cancellation' | 'policy';
  originalCancellationEventId: UUID;
}
```

---

### 3.15 SERVICE_LINE_COMPLETED (PLANNED)

**Status:** PLANNED  
**Domain:** Service Execution (Multi-Service)  
**Purpose:** Individual service line marked complete

```typescript
interface ServiceLineCompletedPayload {
  appointmentId: UUID;
  lineItemId: UUID;
  serviceId: UUID;
  employeeId: UUID;
  price: Decimal;
  completedAt: ISO8601;
}

interface ServiceLineCompletedMetadata extends EventMetadata {
  source: 'employee_self' | 'manual_staff_override';
  appointmentStillHasPendingLines: boolean;
}
```

**Note:** This event enables partial completion tracking. The appointment's overall `execution_status` becomes derived from line items.

---

### 3.16 EMPLOYEE_REASSIGNED (PLANNED)

**Status:** PLANNED  
**Domain:** Booking  
**Purpose:** Appointment reassigned to different employee

```typescript
interface EmployeeReassignedPayload {
  appointmentId: UUID;
  previousEmployeeId: UUID;
  newEmployeeId: UUID;
  reason: string;           // REQUIRED
  reassignmentCount: number;  // How many times reassigned
  payrollImpact: 'recalculate' | 'pending_review' | 'none';
  clientNotified: boolean;
  originalEmployeeNotified: boolean;
  servicesTransferred: UUID[];
}

interface EmployeeReassignedMetadata extends EventMetadata {
  source: 'manual_staff_override';
  previousOwnerIsAvailable: boolean;
  clientAcceptsNewEmployee: boolean;
}
```

**Side Effects:**
- `current_employee_id` updated
- New employee notified
- Original employee notified
- Payroll recalculation triggered (if services already had commission)
- Audit trail extended

---

### 3.17 APPOINTMENT_RESCHEDULED (PLANNED)

**Status:** PLANNED  
**Domain:** Booking  
**Purpose:** Appointment date/time changed

```typescript
interface AppointmentRescheduledPayload {
  appointmentId: UUID;
  previousStartTime: ISO8601;
  previousEndTime: ISO8601;
  newStartTime: ISO8601;
  newEndTime: ISO8601;
  reason: string;
  preserveConfirmation: boolean;
  remindersInvalidated: boolean;
  clientConfirmationStillValid: boolean;
  depositAction: 'transfer' | 'none';
  notificationResent: boolean;
  rescheduleCount: number;
}

interface AppointmentRescheduledMetadata extends EventMetadata {
  source: 'client' | 'manual_staff_override';
  previousBookingSource: BookingSource;
  daysDifference: number;  // Negative if earlier, positive if later
}
```

**Business Rules:**
- If `preserveConfirmation = false`, client must confirm again
- Deposits transfer automatically unless policy says otherwise
- Payroll adjusted based on new timing

---

## 4. Event Versioning

### 4.1 Versioning Strategy

Event schemas are versioned using the `version` field in the envelope:

```typescript
const CURRENT_VERSION = '1.0.0';

// Version format: MAJOR.MINOR.PATCH
// MAJOR: Breaking changes (different payload structure)
// MINOR: Additive changes (new optional fields)
// PATCH: Documentation/clarity changes (no payload change)
```

### 4.2 Version Compatibility

| Consumer Version | Producer Version | Compatible? |
|-----------------|------------------|-------------|
| 1.0.0 | 1.0.0 | ✅ Yes |
| 1.0.0 | 1.1.0 | ✅ Yes (additive) |
| 1.1.0 | 1.0.0 | ⚠️ Maybe (consumer handles old format) |
| 2.0.0 | 1.0.0 | ❌ No (breaking) |

### 4.3 Migration Strategy

When event schema changes:

1. Add new version alongside old
2. Event transformer maps old → new
3. Consumers updated to handle both during transition
4. Old version deprecated with sunset date
5. After sunset, old version removed

---

## 5. Event Producer/Consumer Matrix

| Event | Producer | Consumers | Async? |
|-------|----------|-----------|--------|
| APPOINTMENT_CREATED | `createAppointment` action | Notification Orchestrator, Calendar Service | Yes |
| SERVICE_COMPLETED | `markCompleted` action | Notification Orchestrator, Payroll Service | Yes |
| SERVICE_COMPLETED_MANUALLY | Orchestrator | Notification Orchestrator, Audit Logger, Payroll Service | Yes |
| PAYMENT_CONFIRMED | `confirmService` action | Notification Orchestrator, Payroll Service, Realtime | Yes |
| CLIENT_CONFIRMED | Token confirm route | Orchestrator, Notification Orchestrator | No |
| CLIENT_CONFIRMED_MANUALLY | Orchestrator | Notification Orchestrator, Audit Logger | Yes |
| NEEDS_REVIEW_TRIGGERED | Cron Detector | Orchestrator, Notification Orchestrator | No |
| AUTO_COMPLETION_TRIGGERED | Cron Detector | Orchestrator, Notification Orchestrator, Payroll Service | No |
| NO_SHOW_MARKED | Orchestrator | Notification Orchestrator, Payroll Service, Audit Logger | Yes |
| APPOINTMENT_CANCELLED | `cancelAppointment` action | Notification Orchestrator, Payroll Service, Calendar Service | Yes |
| PAYMENT_REFUNDED | Refund flow (future) | Payroll Service, Audit Logger | Yes |
| DEPOSIT_REQUESTED | Deposit flow (future) | Payment Gateway | Yes |
| DEPOSIT_PAID | Payment Gateway | Orchestrator, Notification Orchestrator | No |
| DEPOSIT_FORFEITED | Orchestrator | Audit Logger, Payroll Service | Yes |
| SERVICE_LINE_COMPLETED | Line item completion (future) | Payroll Service | Yes |
| EMPLOYEE_REASSIGNED | Reassignment flow (future) | Notification Orchestrator, Payroll Service, Audit Logger | Yes |
| APPOINTMENT_RESCHEDULED | Reschedule flow (future) | Notification Orchestrator, Calendar Service, Payroll Service | Yes |

---

## 6. Event Implementation Status Summary

| Event | Status | Version |
|-------|--------|---------|
| APPOINTMENT_CREATED | ✅ IMPLEMENTED | 1.0.0 |
| SERVICE_COMPLETED | ✅ IMPLEMENTED | 1.0.0 |
| SERVICE_COMPLETED_MANUALLY | ✅ IMPLEMENTED | 1.0.0 |
| PAYMENT_CONFIRMED | ✅ IMPLEMENTED | 1.0.0 |
| CLIENT_CONFIRMED | ✅ IMPLEMENTED | 1.0.0 |
| CLIENT_CONFIRMED_MANUALLY | ✅ IMPLEMENTED | 1.0.0 |
| NEEDS_REVIEW_TRIGGERED | ✅ IMPLEMENTED | 1.0.0 |
| AUTO_COMPLETION_TRIGGERED | ✅ IMPLEMENTED | 1.0.0 |
| NO_SHOW_MARKED | ✅ IMPLEMENTED | 1.0.0 |
| APPOINTMENT_CANCELLED | ✅ IMPLEMENTED | 1.0.0 |
| PAYMENT_REFUNDED | 🔄 PLANNED | — |
| DEPOSIT_REQUESTED | 🔄 PLANNED | — |
| DEPOSIT_PAID | 🔄 PLANNED | — |
| DEPOSIT_FORFEITED | 🔄 PLANNED | — |
| SERVICE_LINE_COMPLETED | 🔄 PLANNED | — |
| EMPLOYEE_REASSIGNED | 🔄 PLANNED | — |
| APPOINTMENT_RESCHEDULED | 🔄 PLANNED | — |

**Summary:** 10 events IMPLEMENTED, 7 events PLANNED  
**Coverage:** 59% implemented, 41% future-ready

---

## 7. Event Delivery Guarantees

### 7.1 Delivery Semantics

| Consumer Type | Guarantee | Implementation |
|---------------|-----------|----------------|
| Orchestrator | At-least-once | Event store + deduplication |
| Notification Orchestrator | At-least-once | Queue with retry |
| Payroll Service | At-least-once | Queue with idempotency |
| Audit Logger | At-least-once | Transactional write |
| Realtime | At-most-once | Fire-and-forget |

### 7.2 Idempotency

Events carry `eventId` (UUID) and consumers deduplicate:

```typescript
// In consumer handler
async function handleEvent(event: DomainEventEnvelope): Promise<void> {
  const alreadyProcessed = await db.query(`
    SELECT 1 FROM processed_events
    WHERE event_id = $1 AND consumer = $2
  `, [event.eventId, CONSUMER_NAME]);

  if (alreadyProcessed.rows.length > 0) {
    return;  // Skip, already handled
  }

  await processEvent(event);

  await db.query(`
    INSERT INTO processed_events (event_id, consumer, processed_at)
    VALUES ($1, $2, NOW())
  `, [event.eventId, CONSUMER_NAME]);
}
```

---

## 8. Event Storage

### 8.1 Recommended Schema

```sql
CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,          -- Idempotency key
  event_type VARCHAR(100) NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID,

  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL,

  payload JSONB NOT NULL,
  metadata JSONB NOT NULL,

  -- Partitioning
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
) PARTITION BY RANGE (created_at);

-- Indexes for common queries
CREATE INDEX idx_events_appointment ON domain_events ((metadata->>'appointmentId'));
CREATE INDEX idx_events_correlation ON domain_events (correlation_id);
CREATE INDEX idx_events_type ON domain_events (event_type);
CREATE INDEX idx_events_created ON domain_events (created_at);
```

### 8.2 Retention Policy

| Event Type | Retention |
|------------|-----------|
| Audit-critical (cancellations, refunds) | Indefinite |
| State-changing events | 2 years |
| Notification events | 90 days |
| System health events | 30 days |

---

## 9. Appendix: Event Schema TypeScript Definitions

```typescript
// Domain Events TypeScript Types

export type BookingSource = 'dashboard' | 'public_form' | 'walk_in';
export type CompletionSource = 'employee_self' | 'manual_staff_override' | 'system_auto';
export type ClientConfirmationSource = 'token_link' | 'manual_override' | 'walk_in' | 'auto_confirmed';
export type ServiceExecutionStatus = 'scheduled' | 'marked_complete' | 'marked_complete_manually' | 'auto_completed' | 'confirmed';
export type Role = 'owner' | 'admin' | 'staff' | 'empleado' | 'client';
export type WarningType = 'payroll_impact' | 'client_not_confirmed' | 'employee_not_available' | 'other';

// Event Payload Types
export type AppointmentCreatedPayload = { ... };
export type ServiceCompletedPayload = { ... };
export type ServiceCompletedManuallyPayload = { ... };
export type PaymentConfirmedPayload = { ... };
export type ClientConfirmedPayload = { ... };
export type ClientConfirmedManuallyPayload = { ... };
export type NeedsReviewTriggeredPayload = { ... };
export type AutoCompletionTriggeredPayload = { ... };
export type NoShowMarkedPayload = { ... };
export type AppointmentCancelledPayload = { ... };
export type PaymentRefundedPayload = { ... };         // PLANNED
export type DepositRequestedPayload = { ... };        // PLANNED
export type DepositPaidPayload = { ... };             // PLANNED
export type DepositForfeitedPayload = { ... };        // PLANNED
export type ServiceLineCompletedPayload = { ... };    // PLANNED
export type EmployeeReassignedPayload = { ... };      // PLANNED
export type AppointmentRescheduledPayload = { ... };  // PLANNED
```

---

**END OF DOCUMENT**
