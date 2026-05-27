> **STATUS: LEGACY / ARCHIVED**
> Este documento se mantiene como referencia hist�rica.
> Su contenido puede estar desactualizado. Ver docs/INDEX.md para la documentaci�n vigente.
> ---

# ORCHESTRATOR ARCHITECTURE — Appointments v2.0

**Document:** 03-ORCHESTRATOR-ARCHITECTURE.md  
**Status:** Draft for Review  
**Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Backend Architecture  

---

## 1. Overview

The **AppointmentOrchestrator** is the central coordinator for all appointment state transitions. It validates commands, enforces state machine rules, emits domain events, and orchestrates side effects.

**Design Principles:**
- **Single Authority:** All state transitions pass through the orchestrator — no direct mutations
- **Stateless Coordination:** Orchestrator holds no state; state lives in the database
- **Event-Driven:** All changes expressed as immutable domain events
- **Fail-Fast:** Validate before executing; reject invalid transitions immediately
- **Extensible:** New commands and events added without modifying core logic

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     APPOINTMENT ORCHESTRATOR                          │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Command    │  │ Transition  │  │   Event     │  │   Side      │  │  │
│  │  │  Validator  │──│   Engine    │──│  Emitter    │──│  Effect     │  │  │
│  │  │             │  │             │  │             │  │  Coordinator│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │        │                │                │                │          │  │
│  └────────┼────────────────┼────────────────┼────────────────┼──────────┘  │
│           │                │                │                │             │
│  ┌────────▼────────────────▼────────────────▼────────────────▼──────────┐ │
│  │                         EVENT BUS                                      │ │
│  │                    (Supabase Realtime)                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOMAIN LAYER                                     │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Domain Events  │  │    Types        │  │   Value         │            │
│  │  (Immutable)    │  │  (Enums, State) │  │   Objects       │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                               │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │    Event Store  │  │    Repository    │  │    Event Bus   │            │
│  │   (Postgres)    │  │                 │  │   (Realtime)    │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Orchestrator Responsibilities

### 3.1 Core Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Command Validation** | Validate actor permissions, current state, required fields |
| **Transition Enforcement** | Ensure only valid state transitions execute |
| **Event Emission** | Emit immutable domain events for every state change |
| **Idempotency** | Prevent duplicate processing of same command |
| **Locking** | Prevent concurrent modifications to same appointment |
| **Error Handling** | Return structured errors with codes and recovery hints |
| **Audit Trail** | Record full context for every transition |

### 3.2 Out of Scope

| Responsibility | Reason |
|----------------|--------|
| Direct notification sending | Delegated to Notification Orchestrator |
| Direct payroll computation | Delegated to Payroll Service |
| Direct database reads/writes | Delegated to Repository |
| Business rule evaluation | Delegated to domain-specific validators |

---

## 4. Command Definitions

### 4.1 Command Interface

```typescript
interface Command {
  commandId: UUID;         // Unique command identifier (for idempotency)
  appointmentId: UUID;     // Target appointment
  actorId: UUID | null;     // Who is executing (null for system)
  actorRole: Role | null;
  timestamp: ISO8601;
  correlationId: UUID;     // Links related commands
}

interface CommandResult<T = unknown> {
  success: boolean;
  eventId: UUID | null;    // The emitted event if successful
  newState: AppointmentState | null;
  error: CommandError | null;
  payload: T | null;
}

interface CommandError {
  code: ErrorCode;
  message: string;
  details: Record<string, unknown> | null;
  recovery: RecoveryHint | null;
}

type ErrorCode =
  | 'INVALID_TRANSITION'
  | 'FORBIDDEN'
  | 'RESOURCE_LOCKED'
  | 'APPOINTMENT_NOT_FOUND'
  | 'REASON_REQUIRED'
  | 'WARNING_NOT_ACKNOWLEDGED'
  | 'ALREADY_COMPLETED'
  | 'INVALID_STATE'
  | 'CONFLICTING_TRANSITION'
  | 'VALIDATION_FAILED';

interface RecoveryHint {
  action: 'retry' | 'check_state' | 'contact_support' | 'none';
  retryAfterMs: number | null;
}
```

### 4.2 Command Catalog

| Command | Purpose | Actor | Reason Required |
|---------|---------|-------|-----------------|
| `CompleteServiceCommand` | Employee marks service done | Employee (own) | No |
| `ManualCompletionCommand` | Staff marks complete manually | Staff/Admin/Owner | Yes |
| `ConfirmPaymentCommand` | Staff confirms payment collected | Staff/Admin/Owner | No |
| `ManualClientConfirmCommand` | Staff confirms client manually | Staff/Admin/Owner | Yes |
| `MarkNoShowCommand` | Staff marks client as no-show | Staff/Admin/Owner | Yes |
| `CancelAppointmentCommand` | Cancel appointment | Client/Staff/Admin/Owner | Yes (staff) |
| `RescheduleCommand` | Change appointment time | Client/Staff (future) | Yes |
| `ReassignEmployeeCommand` | Change assigned employee | Staff/Admin/Owner (future) | Yes |

---

## 5. Command-to-Event Mapping

### 5.1 Mapping Table

| Command | Transition | Event Emitted | Side Effects |
|---------|------------|---------------|--------------|
| `CompleteServiceCommand` | SCHEDULED → MARKED_COMPLETE | `SERVICE_COMPLETED` | Notification to assistants |
| `ManualCompletionCommand` | SCHEDULED/NEEDS_REVIEW → MARKED_COMPLETE_MANUALLY | `SERVICE_COMPLETED_MANUALLY` | Audit log, warning notification |
| `ConfirmPaymentCommand` | MARKED_COMPLETE → CONFIRMED | `PAYMENT_CONFIRMED` | Notification to employee, Payroll |
| `ManualClientConfirmCommand` | null → MANUAL_OVERRIDE | `CLIENT_CONFIRMED_MANUALLY` | Audit log |
| `MarkNoShowCommand` | NEEDS_REVIEW/AUTO_COMPLETED → NO_SHOW | `NO_SHOW_MARKED` | Notification, Payroll reversal |
| `CancelAppointmentCommand` | ACTIVE → CANCELLED | `APPOINTMENT_CANCELLED` | Notification, Payroll handling |
| `RescheduleCommand` | ACTIVE → ACTIVE (time change) | `APPOINTMENT_RESCHEDULED` | Notification, Calendar update |
| `ReassignEmployeeCommand` | (employee change) | `EMPLOYEE_REASSIGNED` | Notification, Payroll update |

### 5.2 Event Metadata from Commands

Every command carries metadata that becomes event metadata:

```typescript
function commandToMetadata(cmd: Command): EventMetadata {
  return {
    actorId: cmd.actorId,
    actorRole: cmd.actorRole,
    organizationId: getOrganizationFromAppointment(cmd.appointmentId),
    appointmentId: cmd.appointmentId,
    ipAddress: getIpFromContext(),
    userAgent: getUserAgentFromContext(),
    cronRunId: cmd.cronRunId || null,
  };
}
```

---

## 6. Validation Layer

### 6.1 Validation Pipeline

Every command passes through validation layers:

```
Command Received
      │
      ▼
┌─────────────────────────┐
│ 1. Idempotency Check    │─── Duplicate ──▶ Return existing result
└───────────┬─────────────┘
            │ New command
            ▼
┌─────────────────────────┐
│ 2. Existence Check     │─── Not found ──▶ ERROR: APPOINTMENT_NOT_FOUND
└───────────┬─────────────┘
            │ Found
            ▼
┌─────────────────────────┐
│ 3. Permission Check    │─── Forbidden ──▶ ERROR: FORBIDDEN
└───────────┬─────────────┘
            │ Authorized
            ▼
┌─────────────────────────┐
│ 4. State Validation    │─── Invalid ────▶ ERROR: INVALID_TRANSITION
└───────────┬─────────────┘
            │ Valid
            ▼
┌─────────────────────────┐
│ 5. Business Rule Check  │─── Violated ───▶ ERROR: VALIDATION_FAILED
└───────────┬─────────────┘
            │ Passed
            ▼
┌─────────────────────────┐
│ 6. Acquire Lock        │─── Locked ─────▶ ERROR: RESOURCE_LOCKED
└───────────┬─────────────┘
            │ Locked
            ▼
    Execute Transition
```

### 6.2 Permission Validation

```typescript
function validatePermission(
  command: Command,
  currentState: AppointmentState
): CommandResult | null {
  const { actorRole, commandType } = command;

  const permissionMatrix: Record<string, Role[]> = {
    'CompleteServiceCommand': ['empleado', 'staff', 'admin', 'owner'],
    'ManualCompletionCommand': ['staff', 'admin', 'owner'],
    'ConfirmPaymentCommand': ['staff', 'admin', 'owner'],
    'ManualClientConfirmCommand': ['staff', 'admin', 'owner'],
    'MarkNoShowCommand': ['staff', 'admin', 'owner'],
    'CancelAppointmentCommand': ['empleado', 'staff', 'admin', 'owner', 'client'],
    // FUTURE
    'RescheduleCommand': ['staff', 'admin', 'owner'],
    'ReassignEmployeeCommand': ['staff', 'admin', 'owner'],
  };

  const allowedRoles = permissionMatrix[commandType] || [];

  if (!allowedRoles.includes(actorRole)) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Role ${actorRole} cannot execute ${commandType}`,
        details: { requiredRoles: allowedRoles },
        recovery: { action: 'contact_support', retryAfterMs: null }
      }
    };
  }

  return null; // Valid
}
```

### 6.3 State Validation

```typescript
function validateTransition(
  currentState: AppointmentState,
  command: Command
): CommandResult | null {
  // Build allowed transitions map
  const allowedTransitions: Record<ServiceExecutionStatus, string[]> = {
    'scheduled': ['CompleteServiceCommand', 'ManualCompletionCommand', 'CancelAppointmentCommand'],
    'marked_complete': ['ConfirmPaymentCommand', 'CancelAppointmentCommand'],
    'marked_complete_manually': ['ConfirmPaymentCommand', 'CancelAppointmentCommand'],
    'auto_completed': ['ConfirmPaymentCommand', 'MarkNoShowCommand', 'CancelAppointmentCommand'],
    'confirmed': [], // Terminal
  };

  const bookingTransitions: Record<BookingStatus, string[]> = {
    'active': ['CancelAppointmentCommand', 'MarkNoShowCommand'],
    'cancelled': [], // Terminal
    'no_show': [],   // Terminal
  };

  const allowedExecTransitions = allowedTransitions[currentState.execution];
  const allowedBookTransitions = bookingTransitions[currentState.booking];

  const allAllowed = [...allowedExecTransitions, ...allowedBookTransitions];

  if (!allAllowed.includes(command.constructor.name)) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: `Cannot execute ${command.constructor.name} from ${currentState.execution}/${currentState.booking}`,
        details: { allowed: allAllowed },
        recovery: { action: 'check_state', retryAfterMs: null }
      }
    };
  }

  return null; // Valid
}
```

### 6.4 Business Rule Validation

```typescript
function validateBusinessRules(
  command: Command,
  currentState: AppointmentState
): CommandResult | null {
  // BR-005: Manual completion requires reason >= 10 chars
  if (command instanceof ManualCompletionCommand) {
    if (!command.reason || command.reason.length < 10) {
      return {
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Manual completion requires a reason of at least 10 characters',
          details: { reasonLength: command.reason?.length || 0 },
          recovery: { action: 'none', retryAfterMs: null }
        }
      };
    }

    if (!command.warningAcknowledged) {
      return {
        success: false,
        error: {
          code: 'WARNING_NOT_ACKNOWLEDGED',
          message: 'Warning must be acknowledged before manual completion',
          details: null,
          recovery: { action: 'none', retryAfterMs: null }
        }
      };
    }
  }

  // BR-006: No payment on cancelled/no-show
  if (command instanceof ConfirmPaymentCommand) {
    if (currentState.booking === 'cancelled' || currentState.booking === 'no_show') {
      return {
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Cannot collect payment from cancelled or no-show appointment',
          details: { bookingStatus: currentState.booking },
          recovery: { action: 'none', retryAfterMs: null }
        }
      };
    }
  }

  // BR-007: Only staff can cancel for other clients
  if (command instanceof CancelAppointmentCommand) {
    if (command.actorRole !== 'client' && !command.reason) {
      return {
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Staff cancellation requires a reason',
          details: null,
          recovery: { action: 'none', retryAfterMs: null }
        }
      };
    }
  }

  return null; // Valid
}
```

---

## 7. Transition Engine

### 7.1 State Computation

```typescript
function computeNextState(
  currentState: AppointmentState,
  command: Command,
  event: DomainEvent
): AppointmentState {
  const nextState = { ...currentState };

  switch (event.eventType) {
    case 'SERVICE_COMPLETED':
      nextState.execution = 'marked_complete';
      nextState.completionSource = 'employee_self';
      break;

    case 'SERVICE_COMPLETED_MANUALLY':
      nextState.execution = 'marked_complete_manually';
      nextState.completionSource = 'manual_staff_override';
      nextState.flags.manualOverrideUsed = true;
      nextState.flags.lastOverrideReason = command.reason;
      nextState.flags.allWarningsAcknowledged.push(...command.warningsShown);
      break;

    case 'PAYMENT_CONFIRMED':
      nextState.execution = 'confirmed';
      nextState.paymentStatus = 'collected';
      break;

    case 'CLIENT_CONFIRMED':
      nextState.clientConfirmationSource = 'token_link';
      break;

    case 'CLIENT_CONFIRMED_MANUALLY':
      nextState.clientConfirmationSource = 'manual_override';
      nextState.flags.manualOverrideUsed = true;
      break;

    case 'NO_SHOW_MARKED':
      nextState.booking = 'no_show';
      nextState.execution = 'no_show';
      nextState.flags.manualOverrideUsed = true;
      break;

    case 'APPOINTMENT_CANCELLED':
      nextState.booking = 'cancelled';
      break;

    case 'NEEDS_REVIEW_TRIGGERED':
      nextState.flags.needsReview = true;
      break;

    case 'AUTO_COMPLETION_TRIGGERED':
      nextState.execution = 'auto_completed';
      nextState.completionSource = 'system_auto';
      nextState.flags.autoCompleted = true;
      nextState.flags.needsReview = false; // Resolved
      break;

    case 'PAYMENT_REFUNDED':
      nextState.paymentStatus = 'refunded';
      break;

    default:
      // No state change for events that only trigger side effects
      break;
  }

  return nextState;
}
```

### 7.2 Locking Strategy

```typescript
async function acquireLock(appointmentId: UUID, timeoutMs = 5000): Promise<boolean> {
  const lockKey = `appointment:lock:${appointmentId}`;
  const lockValue = `${process.pid}:${Date.now()}`;

  const result = await db.query(`
    SELECT pg_try_advisory_lock(hashtext($1)) as acquired
  `, [lockKey]);

  if (!result.rows[0].acquired) {
    // Wait briefly and retry once
    await sleep(100);
    const retry = await db.query(`
      SELECT pg_try_advisory_lock(hashtext($1)) as acquired
    `, [lockKey]);
    return retry.rows[0].acquired;
  }

  return true;
}

async function releaseLock(appointmentId: UUID): Promise<void> {
  const lockKey = `appointment:lock:${appointmentId}`;
  await db.query(`SELECT pg_advisory_unlock(hashtext($1))`, [lockKey]);
}
```

### 7.3 Idempotency Check

```typescript
async function checkIdempotency(command: Command): Promise<CommandResult | null> {
  // Check if this command was already processed
  const existing = await db.query(`
    SELECT event_id, new_state, error_code
    FROM command_results
    WHERE command_id = $1
  `, [command.commandId]);

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    // Return cached result
    if (row.error_code) {
      return {
        success: false,
        eventId: row.event_id,
        newState: null,
        error: { code: row.error_code, message: '', details: null, recovery: null },
        payload: null
      };
    }
    return {
      success: true,
      eventId: row.event_id,
      newState: JSON.parse(row.new_state),
      error: null,
      payload: null
    };
  }

  return null; // New command, continue processing
}
```

---

## 8. Event Emission

### 8.1 Event Creation

```typescript
async function createAndEmitEvent(
  command: Command,
  currentState: AppointmentState,
  nextState: AppointmentState,
  eventType: EventType
): Promise<DomainEvent> {
  const eventId = generateUUID();

  const event: DomainEvent = {
    eventId,
    eventType,
    correlationId: command.correlationId,
    causationId: command.commandId,
    timestamp: new Date().toISOString(),
    source: command.actorRole === 'system' ? 'system_auto' : 'manual',
    version: CURRENT_EVENT_VERSION,
    payload: buildPayload(eventType, command, currentState, nextState),
    metadata: {
      actorId: command.actorId,
      actorRole: command.actorRole,
      organizationId: getOrgFromAppointment(command.appointmentId),
      appointmentId: command.appointmentId,
      ipAddress: getIpFromContext(),
      userAgent: getUserAgentFromContext(),
      cronRunId: command.cronRunId || null,
    }
  };

  // Persist event to event store
  await db.query(`
    INSERT INTO domain_events (
      event_id, event_type, correlation_id, causation_id,
      version, timestamp, source, payload, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [event.eventId, event.eventType, event.correlationId, event.causationId,
      event.version, event.timestamp, event.source, event.payload, event.metadata]);

  // Emit to event bus for async consumers
  await eventBus.emit(event);

  return event;
}
```

### 8.2 Event Bus Integration

```typescript
interface EventBus {
  emit(event: DomainEvent): Promise<void>;
  subscribe(eventType: EventType, handler: EventHandler): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
}

// Implementation using Supabase Realtime
class SupabaseEventBus implements EventBus {
  async emit(event: DomainEvent): Promise<void> {
    // Broadcast to all subscribers
    await supabase.channel('appointments')
      .send({
        type: 'broadcast',
        event: event.eventType,
        payload: event
      });
  }

  async subscribe(eventType: EventType, handler: EventHandler): Promise<Subscription> {
    return supabase.channel(`events:${eventType}`)
      .on('broadcast', { event: eventType }, (payload) => {
        handler(payload.event);
      })
      .subscribe();
  }
}
```

---

## 9. Error Handling

### 9.1 Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details: Record<string, unknown> | null;
    recovery: {
      action: 'retry' | 'check_state' | 'contact_support' | 'none';
      retryAfterMs: number | null;
    };
  };
  eventId: null;
  newState: null;
}

// Example error responses:
{
  success: false,
  error: {
    code: 'INVALID_TRANSITION',
    message: 'Cannot execute ConfirmPaymentCommand from scheduled state',
    details: {
      currentState: 'scheduled',
      attemptedTransition: 'ConfirmPaymentCommand',
      allowedTransitions: ['CompleteServiceCommand', 'ManualCompletionCommand']
    },
    recovery: {
      action: 'check_state',
      retryAfterMs: null
    }
  }
}

{
  success: false,
  error: {
    code: 'RESOURCE_LOCKED',
    message: 'Appointment is being modified by another process',
    details: null,
    recovery: {
      action: 'retry',
      retryAfterMs: 1000
    }
  }
}
```

### 9.2 Error Code Reference

| Code | HTTP Status | Description | Recovery |
|------|-------------|-------------|----------|
| INVALID_TRANSITION | 409 | State doesn't allow this transition | check_state |
| FORBIDDEN | 403 | Actor not authorized | contact_support |
| RESOURCE_LOCKED | 423 | Concurrent modification | retry (1s backoff) |
| APPOINTMENT_NOT_FOUND | 404 | Appointment doesn't exist | none |
| REASON_REQUIRED | 400 | Missing required reason | none |
| WARNING_NOT_ACKNOWLEDGED | 400 | Did not confirm warning | none |
| ALREADY_COMPLETED | 409 | Already in terminal state | none |
| INVALID_STATE | 409 | State validation failed | check_state |
| CONFLICTING_TRANSITION | 409 | Another transition in progress | retry |
| VALIDATION_FAILED | 400 | Business rule violation | none |

---

## 10. Side Effect Coordination

### 10.1 Side Effect Types

| Type | Execution | Retry | Examples |
|------|-----------|-------|----------|
| Synchronous | Immediate | No | State persistence |
| Async Queue | Background | Yes (3x) | Notifications, Payroll |
| Fire-and-Forget | Background | No | Realtime updates |
| Critical | Immediate | Saga compensation | Financial transactions |

### 10.2 Side Effect Registration

```typescript
const SIDE_EFFECTS: Record<EventType, SideEffect[]> = {
  'SERVICE_COMPLETED': [
    { type: 'async', queue: 'notifications', effect: sendServiceReadyNotification },
    { type: 'async', queue: 'payroll', effect: queuePayrollCalculation },
  ],
  'PAYMENT_CONFIRMED': [
    { type: 'async', queue: 'notifications', effect: sendConfirmationNotification },
    { type: 'async', queue: 'payroll', effect: createPayrollItem },
    { type: 'fire_and_forget', effect: updateRealtimeUI },
  ],
  'SERVICE_COMPLETED_MANUALLY': [
    { type: 'async', queue: 'notifications', effect: sendManualCompletionAlert },
    { type: 'sync', effect: writeAuditRecord },
  ],
  'APPOINTMENT_CANCELLED': [
    { type: 'async', queue: 'notifications', effect: sendCancellationNotice },
    { type: 'async', queue: 'payroll', effect: reversePayrollIfNeeded },
    { type: 'fire_and_forget', effect: updateCalendarAvailability },
  ],
  'AUTO_COMPLETION_TRIGGERED': [
    { type: 'async', queue: 'notifications', effect: sendAutoCompletedAlert },
    { type: 'async', queue: 'payroll', effect: createPayrollItemSystem },
  ],
};
```

### 10.3 Side Effect Execution

```typescript
async function executeSideEffects(event: DomainEvent): Promise<void> {
  const effects = SIDE_EFFECTS[event.eventType] || [];

  const results = await Promise.allSettled(
    effects.map(effect => executeSideEffect(effect, event))
  );

  // Log failures but don't fail the main transaction
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Side effect ${index} failed for ${event.eventType}:`, result.reason);
      // Queue for retry if applicable
      queueRetry(event, effects[index], result.reason);
    }
  });
}

async function executeSideEffect(effect: SideEffect, event: DomainEvent): Promise<void> {
  switch (effect.type) {
    case 'sync':
      await effect.effect(event);
      break;
    case 'async':
      await queue.enqueue(effect.queue, {
        eventId: event.eventId,
        eventType: event.eventType,
        payload: effect.effect,
        maxRetries: 3,
        backoffMs: 5000,
      });
      break;
    case 'fire_and_forget':
      effect.effect(event).catch(err => console.error('Fire-and-forget failed:', err));
      break;
  }
}
```

---

## 11. Complete Execution Flow

### 11.1 Happy Path

```typescript
async function executeCommand(command: Command): Promise<CommandResult> {
  // 1. Idempotency check
  const cached = await checkIdempotency(command);
  if (cached) return cached;

  // 2. Load current state
  const currentState = await appointmentRepository.findById(command.appointmentId);
  if (!currentState) {
    return { success: false, error: { code: 'APPOINTMENT_NOT_FOUND', ... }, ... };
  }

  // 3. Validate permissions
  const permError = validatePermission(command, currentState);
  if (permError) return permError;

  // 4. Validate transition
  const transError = validateTransition(command, currentState);
  if (transError) return transError;

  // 5. Validate business rules
  const ruleError = validateBusinessRules(command, currentState);
  if (ruleError) return ruleError;

  // 6. Acquire lock
  const locked = await acquireLock(command.appointmentId);
  if (!locked) {
    return { success: false, error: { code: 'RESOURCE_LOCKED', ... }, ... };
  }

  try {
    // 7. Determine event type
    const eventType = commandToEventType(command);

    // 8. Create event
    const event = await createAndEmitEvent(command, currentState, null, eventType);

    // 9. Compute new state
    const nextState = computeNextState(currentState, command, event);

    // 10. Persist state
    await appointmentRepository.save(nextState);

    // 11. Persist command result for idempotency
    await persistCommandResult(command, event, nextState);

    // 12. Execute side effects (async)
    executeSideEffects(event).catch(console.error);

    return {
      success: true,
      eventId: event.eventId,
      newState,
      error: null,
      payload: null,
    };
  } finally {
    await releaseLock(command.appointmentId);
  }
}
```

### 11.2 Timeout Handling

```typescript
async function executeCommandWithTimeout(
  command: Command,
  timeoutMs = 10000
): Promise<CommandResult> {
  try {
    return await Promise.race([
      executeCommand(command),
      new Promise<CommandResult>((_, reject) =>
        setTimeout(() => reject(new Error('COMMAND_TIMEOUT')), timeoutMs)
      )
    ]);
  } catch (err) {
    if (err.message === 'COMMAND_TIMEOUT') {
      return {
        success: false,
        eventId: null,
        newState: null,
        error: {
          code: 'RESOURCE_LOCKED',
          message: 'Command timed out - please retry',
          details: null,
          recovery: { action: 'retry', retryAfterMs: 2000 }
        },
        payload: null,
      };
    }
    throw err;
  }
}
```

---

## 12. Failure Recovery

### 12.1 Retry Strategy

| Failure Type | Retry | Backoff | Max Attempts |
|-------------|-------|---------|--------------|
| Network transient | Yes | Exponential (1s, 2s, 4s) | 3 |
| Lock contention | Yes | Linear (500ms) | 2 |
| Validation failure | No | — | — |
| Business rule violation | No | — | — |
| System error | Yes | Exponential + jitter | 5 |

### 12.2 Dead Letter Queue

```typescript
interface DLQEntry {
  eventId: UUID;
  eventType: EventType;
  payload: unknown;
  error: string;
  attempts: number;
  lastAttemptAt: ISO8601;
  nextRetryAt: ISO8601 | null;
  resolved: boolean;
}

// DLQ processor runs every 5 minutes
async function processDLQ(): Promise<void> {
  const entries = await db.query(`
    SELECT * FROM dlq
    WHERE resolved = false
    AND next_retry_at <= NOW()
    AND attempts < 5
    ORDER BY last_attempt_at ASC
    LIMIT 100
  `);

  for (const entry of entries) {
    try {
      await retryEvent(entry);
      await markDLQResolved(entry.eventId);
    } catch (err) {
      await updateDLQEntry(entry.eventId, {
        attempts: entry.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt: calculateNextRetry(entry.attempts + 1),
        error: err.message,
      });
    }
  }
}
```

### 12.3 Reconciliation

```typescript
// Daily reconciliation job
async function reconcileAppointments(): Promise<ReconciliationReport> {
  const issues: ReconciliationIssue[] = [];

  // Find appointments with inconsistent state
  const candidates = await db.query(`
    SELECT a.* FROM appointments a
    WHERE a.execution_status = 'confirmed'
    AND NOT EXISTS (
      SELECT 1 FROM payroll_items pi
      WHERE pi.appointment_id = a.id
    )
  `);

  for (const apt of candidates) {
    issues.push({
      appointmentId: apt.id,
      issue: 'MISSING_PAYROLL',
      severity: 'high',
      createdAt: new Date().toISOString(),
    });

    // Queue missing payroll
    await queue.enqueue('payroll', {
      eventType: 'PAYMENT_CONFIRMED',
      appointmentId: apt.id,
      action: 'reconcile',
    });
  }

  return {
    issuesFound: issues.length,
    issues,
    resolved: 0,
    timestamp: new Date().toISOString(),
  };
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
describe('AppointmentOrchestrator', () => {
  describe('CompleteServiceCommand', () => {
    it('should transition from SCHEDULED to MARKED_COMPLETE', async () => {
      const state = createState({ execution: 'scheduled' });
      const command = createCommand('CompleteServiceCommand');

      const result = await orchestrator.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.newState.execution).toBe('marked_complete');
    });

    it('should reject if already confirmed', async () => {
      const state = createState({ execution: 'confirmed' });
      const command = createCommand('CompleteServiceCommand');

      const result = await orchestrator.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_TRANSITION');
    });

    it('should reject if actor is not the assigned employee', async () => {
      const state = createState({ execution: 'scheduled', employeeId: 'emp-1' });
      const command = createCommand('CompleteServiceCommand', { actorId: 'emp-2' });

      const result = await orchestrator.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FORBIDDEN');
    });
  });

  describe('ManualCompletionCommand', () => {
    it('should require reason >= 10 characters', async () => {
      const state = createState({ execution: 'scheduled' });
      const command = createCommand('ManualCompletionCommand', { reason: 'short' });

      const result = await orchestrator.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('REASON_REQUIRED');
    });

    it('should require warning acknowledgment', async () => {
      const state = createState({ execution: 'scheduled' });
      const command = createCommand('ManualCompletionCommand', {
        reason: 'Employee was sick, needed to close out',
        warningAcknowledged: false,
      });

      const result = await orchestrator.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('WARNING_NOT_ACKNOWLEDGED');
    });
  });
});
```

### 13.2 Integration Tests

```typescript
describe('Appointment Orchestrator Integration', () => {
  it('should emit event and update state atomically', async () => {
    const appointmentId = await createTestAppointment();
    const command = createCommand('CompleteServiceCommand');

    const result = await orchestrator.executeCommand(command);

    // Verify event was persisted
    const event = await eventStore.findById(result.eventId);
    expect(event.eventType).toBe('SERVICE_COMPLETED');

    // Verify state was updated
    const state = await appointmentRepository.findById(appointmentId);
    expect(state.execution).toBe('marked_complete');

    // Verify idempotency - second execution returns same result
    const result2 = await orchestrator.executeCommand(command);
    expect(result2.success).toBe(true);
    expect(result2.eventId).toBe(result.eventId);
  });
});
```

---

## 14. Monitoring and Observability

### 14.1 Key Metrics

```typescript
const ORCHESTRATOR_METRICS = {
  // Command throughput
  'command.received': Counter,
  'command.success': Counter,
  'command.failure': Counter,

  // Latency
  'command.duration.ms': Histogram,
  'lock.acquisition.ms': Histogram,
  'event.emission.ms': Histogram,

  // Errors
  'error.invalid_transition': Counter,
  'error.forbidden': Counter,
  'error.resource_locked': Counter,
  'error.validation_failed': Counter,

  // Events
  'event.published': Counter,
  'event.consumed': Counter,
  'event.dlq': Counter,
};
```

### 14.2 Health Checks

```typescript
async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.all([
    db.ping(),           // Database connectivity
    eventBus.ping(),     // Event bus connectivity
    acquireLock('health-check-test'),  // Lock system
  ]);

  return {
    status: checks.every(c => c.ok) ? 'healthy' : 'degraded',
    checks: {
      database: checks[0],
      eventBus: checks[1],
      locking: checks[2],
    },
    timestamp: new Date().toISOString(),
  };
}
```

---

## 15. Future Extension Points

### 15.1 Saga Support

For long-running transactions (e.g., deposit → confirmation → payment):

```typescript
interface SagaState {
  sagaId: UUID;
  appointmentId: UUID;
  steps: SagaStep[];
  status: 'pending' | 'processing' | 'completed' | 'compensating' | 'failed';
}

interface SagaStep {
  stepId: UUID;
  command: Command;
  compensatingCommand: Command | null;
  status: 'pending' | 'executed' | 'compensated' | 'failed';
}
```

### 15.2 Process Manager

For multi-appointment workflows (e.g., series appointments, packages):

```typescript
interface ProcessManager {
  processId: UUID;
  processType: 'series' | 'package';
  appointmentIds: UUID[];
  currentIndex: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}
```

---

**END OF DOCUMENT**
