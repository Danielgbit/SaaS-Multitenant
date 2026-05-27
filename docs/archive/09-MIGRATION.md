> **STATUS: LEGACY / ARCHIVED**
> Este documento se mantiene como referencia hist�rica.
> Su contenido puede estar desactualizado. Ver docs/INDEX.md para la documentaci�n vigente.
> ---

# MIGRATION STRATEGY — Appointment Domain v2.0

**Document:** 09-MIGRATION.md  
**Status:** Draft for Review  
**Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Backend Architecture  

---

## 1. Overview

This document defines the incremental migration strategy from the current dual-flow appointment system (Flow A + Flow B) to the unified domain model defined in 01-DOMAIN-MODEL.md.

**Constraint:** ZERO downtime. ZERO data loss. Production human operations continue uninterrupted.

**Pattern:** Strangler Fig — we wrap, shadow, verify, and cutover incrementally.

---

## 2. Current State Architecture

```
                     CURRENT SYSTEM (PRE-MIGRATION)
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  FLOW A                                     FLOW B                      │
│  ┌──────────────────────┐                   ┌──────────────────────┐    │
│  │ appointments         │                   │ appointment_         │    │
│  │ .status              │                   │ confirmations        │    │
│  │ .confirmation_status │                   │ .status              │    │
│  └──────────────────────┘                   └──────────────────────┘    │
│           │                                        │                    │
│           ▼                                        ▼                    │
│  ┌──────────────────────┐                   ┌──────────────────────┐    │
│  │ Server Actions:      │                   │ Server Actions:      │    │
│  │ - markCompleted      │                   │ - createConfirmation │    │
│  │ - confirmService     │                   │ - confirmByReception │    │
│  │ - markManually       │                   └──────────────────────┘    │
│  └──────────────────────┘                                                │
│           │                                        │                    │
│           ▼                                        ▼                    │
│  ┌──────────────────────────────────────────────────────┐               │
│  │                  CRON (direct mutation)              │               │
│  │  - check-reminders: 3min interval                    │               │
│  │  - Direct UPDATE on appointments.confirmation_status │               │
│  └──────────────────────────────────────────────────────┘               │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────────────────────────────────────────┐               │
│  │                  SIDE EFFECTS (inline)               │               │
│  │  - Notifications (inside markCompleted)              │               │
│  │  - Payroll (fire-and-forget inside confirmService)   │               │
│  │  - Audit logs (inside each action)                   │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Current Data Model

```sql
-- Legacy columns we need to migrate
appointments {
  id                UUID PK
  status            VARCHAR    -- 'pending' | 'confirmed' | 'completed' | 'canceled' | 'no_show'
  confirmation_status VARCHAR -- 'scheduled' | 'pending_confirmation' | 'completed' | 'confirmed' | 'needs_review'
  completed_at      TIMESTAMPTZ
  completed_by      UUID
  confirmed_at      TIMESTAMPTZ
  confirmed_by      UUID
  price_adjustment  NUMERIC(10,0)
  payment_method    VARCHAR(20)
}

appointment_confirmations {
  id                UUID PK
  appointment_id    UUID REFERENCES appointments(id)
  status            VARCHAR    -- 'pending_employee' | 'pending_reception' | 'completed' | 'no_show' | 'not_performed'
  employee_confirmed_at TIMESTAMPTZ
  reception_confirmed_at TIMESTAMPTZ
  payment_method    VARCHAR
}

confirmation_logs {
  id                UUID PK
  appointment_id    UUID REFERENCES appointments(id)
  action            VARCHAR    -- 'created' | 'confirmed' | 'manually_set' | 'cancelled'
  performed_by      UUID
  performed_by_role VARCHAR
}
```

---

## 3. Target State Architecture

```
                     TARGET SYSTEM (POST-MIGRATION)
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   APPOINTMENT ORCHESTRATOR                        │   │
│  │  (Command → Validate → Transition → Event → Side Effects)        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                           │                                              │
│                           ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    EVENT BUS (Supabase Realtime)                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│        │              │               │              │                  │
│        ▼              ▼               ▼              ▼                  │
│  ┌────────┐  ┌────────────┐  ┌───────────┐  ┌───────────┐             │
│  │Domain  │  │Notification│  │  Payroll  │  │  Audit    │             │
│  │Model   │  │ Service    │  │  Service  │  │  Store    │             │
│  └────────┘  └────────────┘  └───────────┘  └───────────┘             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     CRON (detector only)                          │   │
│  │  - Detects conditions                                            │   │
│  │  - Emits events (NEVER directly mutates)                         │   │
│  │  - AppointmentOrchestrator handles transitions                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Target Data Model

```sql
-- NEW columns (additive, no renames)
appointments {
  -- RETAINED (backward compatible):
  id                UUID PK
  organization_id   UUID
  client_id         UUID
  employee_id       UUID
  start_time        TIMESTAMPTZ
  end_time          TIMESTAMPTZ
  status            VARCHAR     -- RETAINED but deprecated for reads
  confirmation_status VARCHAR  -- RETAINED but deprecated for reads

  -- NEW (additive columns, nullable initially):
  booking_status              VARCHAR CHECK (IN 'active', 'cancelled', 'no_show')
  execution_status            VARCHAR CHECK (IN 'scheduled', 'marked_complete', 'marked_complete_manually', 'auto_completed', 'confirmed')
  payment_status              VARCHAR CHECK (IN 'pending', 'collected', 'refunded')
  client_confirmation_source  VARCHAR CHECK (IN 'token_link', 'manual_override', 'walk_in', 'auto_confirmed')
  completion_source           VARCHAR CHECK (IN 'employee_self', 'manual_staff_override', 'system_auto')
  booking_source              VARCHAR CHECK (IN 'dashboard', 'public_form', 'walk_in')

  -- Flags JSONB
  workflow_flags              JSONB DEFAULT '{}'

  -- Audit tracking
  last_event_id               UUID REFERENCES domain_events(event_id)
  last_event_type             VARCHAR(100)
  last_event_at               TIMESTAMPTZ
}

domain_events {
  event_id          UUID PK
  event_type        VARCHAR(100)
  correlation_id    UUID
  causation_id      UUID
  version           VARCHAR(20)
  timestamp         TIMESTAMPTZ
  source            VARCHAR(50)
  payload           JSONB
  metadata          JSONB
  created_at        DATE      -- Partition key
}

processed_events {
  event_id          UUID
  consumer          VARCHAR(50)
  processed_at      TIMESTAMPTZ
  PRIMARY KEY (event_id, consumer)
}
```

---

## 4. Migration Phases

### 4.1 Phase Overview

```
PHASE 0: CURRENT STATE
  Status quo. Flow A + Flow B. Cron mutates state directly.

PHASE 1: FOUNDATION — State Model + Event Catalog + Orchestrator (8 weeks)
  ├── Add new columns to appointments table (nullable)
  ├── Create domain_events table
  ├── Build AppointmentOrchestrator (no active transitions yet)
  ├── Build EventBus integration
  └── Write sync/backfill logic

PHASE 2: SHADOW MODE — Silent recording (6 weeks)
  ├── Legacy actions → Adapter → Emit events
  ├── Orchestrator executes in shadow (logs state diff)
  ├── State reconciliation checks
  └── Observability dashboards

PHASE 3: DUAL WRITE — Orchestrator writes, legacy still primary (6 weeks)
  ├── Feature flag: NEW_ORCHESTRATOR_ENABLED
  ├── Orchestrator writes new columns
  ├── Legacy writes continue to old columns
  ├── Read paths prefer new columns if available
  └── Reconciliation job fixes divergences

PHASE 4: READ PREFIX — New queries (4 weeks)
  ├── UI components read from new state
  ├── Legacy columns still updated for backup
  ├── Rollback: flip back to legacy reads
  └── Performance monitoring

PHASE 5: WRITE CUTOVER — Legacy writes disabled (4 weeks)
  ├── Orchestrator becomes primary writer
  ├── Legacy actions fail over to orchestrator
  ├── Feature flag: LEGACY_FALLBACK_ENABLED (emergency only)
  └── Final reconciliation

PHASE 6: LEGACY RETIREMENT — Cleanup (4 weeks)
  ├── Remove legacy columns
  ├── Remove adapter layer
  ├── Archive migration artifacts
  └── Documentation update
```

**Total estimated duration: 32 weeks (8 months)**

---

### 4.2 Phase 1: Foundation (Weeks 1-8)

**Goal:** Add new columns, build orchestrator, create event infrastructure. Zero behavior change.

#### 4.2.1 Database Changes

```sql
-- Step 1: Add new columns (nullable, no defaults)
ALTER TABLE appointments
  ADD COLUMN booking_status VARCHAR CHECK (booking_status IN ('active', 'cancelled', 'no_show')),
  ADD COLUMN execution_status VARCHAR CHECK (execution_status IN ('scheduled', 'marked_complete', 'marked_complete_manually', 'auto_completed', 'confirmed')),
  ADD COLUMN payment_status VARCHAR CHECK (payment_status IN ('pending', 'collected', 'refunded')),
  ADD COLUMN client_confirmation_source VARCHAR CHECK (client_confirmation_source IN ('token_link', 'manual_override', 'walk_in', 'auto_confirmed')),
  ADD COLUMN completion_source VARCHAR CHECK (completion_source IN ('employee_self', 'manual_staff_override', 'system_auto')),
  ADD COLUMN booking_source VARCHAR CHECK (booking_source IN ('dashboard', 'public_form', 'walk_in')),
  ADD COLUMN workflow_flags JSONB DEFAULT '{}',
  ADD COLUMN last_event_id UUID REFERENCES domain_events(event_id),
  ADD COLUMN last_event_type VARCHAR(100),
  ADD COLUMN last_event_at TIMESTAMPTZ;

-- Step 2: Create domain_events table
CREATE TABLE domain_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
) PARTITION BY RANGE (created_at);

CREATE TABLE domain_events_default PARTITION OF domain_events
  FOR VALUES FROM ('2025-01-01') TO ('2027-01-01');

CREATE INDEX idx_events_appointment ON domain_events ((metadata->>'appointmentId'));
CREATE INDEX idx_events_correlation ON domain_events (correlation_id);
CREATE INDEX idx_events_type ON domain_events (event_type);
CREATE INDEX idx_events_timestamp ON domain_events (timestamp);

-- Step 3: Create processed_events table
CREATE TABLE processed_events (
  event_id UUID NOT NULL,
  consumer VARCHAR(50) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, consumer)
);
```

#### 4.2.2 Backfill Script (One-time)

```typescript
// bin/backfill-legacy-appointments.ts
// Runs once at end of Phase 1

async function backfillAppointments(batchSize = 100) {
  let cursor = null;
  let total = 0;

  do {
    const batch = await db.query(`
      SELECT * FROM appointments
      WHERE ${cursor ? `id > ${cursor}` : '1=1'}
      AND (booking_status IS NULL OR execution_status IS NULL)
      ORDER BY id
      LIMIT ${batchSize}
    `);

    for (const apt of batch.rows) {
      const newState = mapLegacyToNewState(apt);
      await db.query(`
        UPDATE appointments SET
          booking_status = $2,
          execution_status = $3,
          payment_status = $4,
          client_confirmation_source = $5,
          completion_source = $6,
          booking_source = $7,
          workflow_flags = $8,
          last_event_type = 'MIGRATION_BACKFILL',
          last_event_at = NOW()
        WHERE id = $1
      `, [apt.id, ...Object.values(newState)]);
      total++;
    }

    cursor = batch.rows[batch.rows.length - 1]?.id;
    console.log(`Backfilled ${total} appointments...`);

  } while (cursor);

  console.log(`Backfill complete: ${total} appointments updated`);
}

function mapLegacyToNewState(legacy: any): NewState {
  const bookingStatus = mapBookingStatus(legacy.status);
  const executionStatus = mapExecutionStatus(legacy.status, legacy.confirmation_status);
  // ... mapping logic
  return { bookingStatus, executionStatus, ... };
}
```

#### 4.2.3 Orchestrator Skeleton

```typescript
// Phase 1: Orchestrator exists but does NOT process live transitions
// It's built, tested, and ready — but inactive for production traffic

class AppointmentOrchestrator {
  constructor(
    private eventBus: EventBus,
    private repository: AppointmentRepository,
    private validator: TransitionValidator
  ) {}

  async executeCommand(command: Command): Promise<CommandResult> {
    // Phase 1: Returns 501 Not Implemented
    // Phase 2: Executes in shadow mode (logs only)
    // Phase 3+: Full execution
    throw new NotImplementedError('Orchestrator not yet active');
  }

  // Available for testing only
  async simulateTransition(command: Command): Promise<SimulationResult> {
    // Validates + computes state but doesn't persist
    const state = await this.repository.findById(command.appointmentId);
    const errors = this.validator.validateAll(command, state);
    return { valid: errors.length === 0, errors, computedState: state };
  }
}
```

#### 4.2.4 Deliverables

| Artifact | Description | Tests |
|----------|-------------|-------|
| Database migration | New columns + domain_events table | Rollback script |
| Backfill script | Map all existing appointments to new state | Dry-run mode |
| Orchestrator | Fully built, tested, disabled for prod | Unit + integration |
| Event catalog | TypeScript types for all 10 events | Type-check |
| Validation layer | Permission + transition + business rule checks | Unit tests |

#### 4.2.5 Rollback

```sql
-- Rollback Phase 1
DROP TABLE IF EXISTS processed_events;
DROP TABLE IF EXISTS domain_events;

ALTER TABLE appointments
  DROP COLUMN IF EXISTS booking_status,
  DROP COLUMN IF EXISTS execution_status,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS client_confirmation_source,
  DROP COLUMN IF EXISTS completion_source,
  DROP COLUMN IF EXISTS booking_source,
  DROP COLUMN IF EXISTS workflow_flags,
  DROP COLUMN IF EXISTS last_event_id,
  DROP COLUMN IF EXISTS last_event_type,
  DROP COLUMN IF EXISTS last_event_at;
```

**Rollback impact:** Zero. All new columns are nullable. Legacy operations are unchanged.

---

### 4.3 Phase 2: Shadow Mode (Weeks 9-14)

**Goal:** Legacy actions emit events, orchestrator validates in shadow, state diffs logged. Zero user impact.

```
                          PHASE 2 ARCHITECTURE
┌──────────────────────┐         ┌──────────────────────┐
│  Legacy Actions      │         │  New Orchestrator    │
│  (markCompleted,     │         │  (Shadow Mode)       │
│   confirmService)    │         │                      │
└───────┬──────────────┘         └───────────┬──────────┘
        │                                    │
        │ 1. Legacy action completes          │
        │ 2. Event emitted via adapter        │
        ▼                                    │
┌──────────────────────┐                     │
│  ADAPTER             │                     │
│  ┌──────────────┐    │                     │
│  │ Emit Event   │────┼─────────────────────┘
│  │ (to EventBus)▼    │
│  └────────────────┘  │
│  ┌──────────────┐    │
│  │ Log to       │    │
│  │ event_store  │    │
│  └──────────────┘    │
└──────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│            RECONCILIATION MONITOR           │
│  - Compare old columns vs new columns      │
│  - Alert on divergence > 0.1%              │
│  - Dashboard: slot_gap, time_to_convergence│
└────────────────────────────────────────────┘
```

#### 4.3.1 Adapter Implementation

```typescript
// src/infrastructure/adapters/LegacyAppointmentAdapter.ts
// Wraps EVERY legacy action to emit events

export class LegacyAppointmentAdapter {
  constructor(private eventBus: EventBus) {}

  async afterMarkCompleted(
    appointmentId: UUID,
    actorId: UUID,
    payload: MarkCompletedPayload
  ): Promise<void> {
    // Emit event AFTER legacy action succeeds
    await this.eventBus.emit({
      eventType: 'SERVICE_COMPLETED',
      eventId: generateUUID(),
      correlationId: generateUUID(),
      causationId: null,
      timestamp: new Date().toISOString(),
      source: 'legacy_adapter',
      version: '1.0.0',
      payload: {
        serviceIds: payload.serviceIds,
        notes: payload.notes,
        executionTimeMinutes: payload.executionTimeMinutes,
        priceAdjustments: payload.priceAdjustments || [],
      },
      metadata: {
        actorId,
        actorRole: 'empleado',
        organizationId: payload.organizationId,
        appointmentId,
        ipAddress: null,
        userAgent: null,
        cronRunId: null,
      },
    });
  }

  async afterConfirmService(
    appointmentId: UUID,
    actorId: UUID,
    payload: ConfirmServicePayload
  ): Promise<void> {
    await this.eventBus.emit({
      eventType: 'PAYMENT_CONFIRMED',
      eventId: generateUUID(),
      correlationId: generateUUID(),
      causationId: null,
      timestamp: new Date().toISOString(),
      source: 'legacy_adapter',
      version: '1.0.0',
      payload: {
        paymentMethod: payload.paymentMethod,
        amount: payload.amount,
        currency: 'COP',
        notes: payload.notes || null,
        serviceIds: payload.serviceIds,
        tipAmount: null,
      },
      metadata: {
        actorId,
        actorRole: 'staff',
        organizationId: payload.organizationId,
        appointmentId,
        ipAddress: null,
        userAgent: null,
        cronRunId: null,
      },
    });
  }

  async afterManualMark(
    appointmentId: UUID,
    actorId: UUID,
    payload: ManualMarkPayload
  ): Promise<void> {
    await this.eventBus.emit({
      eventType: 'SERVICE_COMPLETED_MANUALLY',
      eventId: generateUUID(),
      correlationId: generateUUID(),
      causationId: null,
      timestamp: new Date().toISOString(),
      source: 'legacy_adapter',
      version: '1.0.0',
      payload: {
        serviceIds: payload.serviceIds,
        reason: payload.reason,
        warningAcknowledged: payload.warningAcknowledged,
        warningType: payload.warningType,
        originalEndTime: payload.originalEndTime,
        notes: payload.notes || null,
      },
      metadata: {
        actorId,
        actorRole: payload.actorRole,
        organizationId: payload.organizationId,
        appointmentId,
        ipAddress: null,
        userAgent: null,
        cronRunId: null,
      },
    });
  }
}
```

#### 4.3.2 Orchestrator Shadow Execution

```typescript
// Phase 2: Shadow mode — validates logs, never persists

class ShadowOrchestrator {
  async handleEvent(event: DomainEvent): Promise<ShadowResult> {
    // 1. Load current state (from new columns if available, else legacy)
    const currentState = await this.loadState(event.metadata.appointmentId);

    // 2. Simulate transition
    const command = this.eventToCommand(event);
    const errors = this.validator.validateAll(command, currentState);

    if (errors.length > 0) {
      console.warn('[SHADOW] Validation failed:', {
        eventId: event.eventId,
        eventType: event.eventType,
        errors,
        currentState,
      });

      await this.reportValidationError(event, errors);
      return { valid: false, errors };
    }

    // 3. Compute what state WOULD change to
    const newState = this.computeState(currentState, command, event);

    // 4. Record shadow diff
    const diff = this.computeDiff(currentState, newState);
    await this.recordShadowDiff(event, diff);

    console.log('[SHADOW] State validated successfully:', {
      eventId: event.eventId,
      eventType: event.eventType,
      diff,
    });

    return { valid: true, diff };
  }

  private computeDiff(old: AppointmentState, next: AppointmentState): StateDiff {
    const changes: Partial<Record<keyof AppointmentState, { from: unknown; to: unknown }>> = {};
    for (const key of Object.keys(old)) {
      if (old[key] !== next[key]) {
        changes[key] = { from: old[key], to: next[key] };
      }
    }
    return changes;
  }
}
```

#### 4.3.3 Reconciliation Monitor

```typescript
// runs/ReconciliationJob.ts
// Runs every 5 minutes during Phase 2-3

async function reconcileAppointments(): Promise<ReconciliationReport> {
  const divergences = await db.query(`
    SELECT
      a.id,
      a.status AS legacy_booking,
      a.confirmation_status AS legacy_execution,
      a.booking_status AS new_booking,
      a.execution_status AS new_execution,
      a.last_event_type
    FROM appointments a
    WHERE
      a.booking_status IS NOT NULL
      AND (
        map_to_booking_status(a.status) != a.booking_status
        OR map_to_execution_status(a.confirmation_status) != a.execution_status
      )
  `);

  if (divergences.rows.length > 0) {
    console.warn(`[RECONCILE] ${divergences.rows.length} divergences detected`);

    // Auto-resolve via shadow write (Phase 3+)
    for (const row of divergences.rows) {
      await autoResolveDivergence(row);
    }
  }

  return {
    checked: totalAppointments,
    divergences: divergences.rows.length,
    resolved: divergencesResolved,
    timestamp: new Date().toISOString(),
  };
}
```

#### 4.3.4 Observability Dashboards

```typescript
// Metrics exported during Phase 2

const SHADOW_METRICS = {
  // Validation stats
  'shadow.event.received': Counter,         // Total events received
  'shadow.event.valid': Counter,             // Events that passed validation
  'shadow.event.invalid': Counter,           // Events that failed validation
  'shadow.event.diff_detected': Counter,     // Events with state change

  // Divergence detection
  'shadow.divergence.total': Gauge,          // Total divergences
  'shadow.divergence.auto_resolved': Counter, // Auto-resolved divergences
  'shadow.divergence.pending': Gauge,        // Pending manual review

  // Latency
  'shadow.event.latency_ms': Histogram,      // Time from legacy action to shadow validation
};
```

#### 4.3.5 Feature Flag

```typescript
// Feature flag configuration
const FEATURE_FLAGS = {
  // Phase 2
  NEW_EVENT_STORE_ENABLED: true,     // Events go to domain_events table
  SHADOW_MODE_ENABLED: true,         // Orchestrator validates in shadow
  SHADOW_LOG_FAILURES: true,         // Log all validation failures

  // Phase 3+ (stays false until ready)
  NEW_ORCHESTRATOR_ENABLED: false,   // Orchestrator does NOT persist yet
  NEW_STATE_READ_ENABLED: false,     // UI reads from new columns yet
  LEGACY_FALLBACK_ENABLED: false,    // Legacy fallback path
};
```

#### 4.3.6 Durations & Success Criteria

| Metric | Target | Exit Condition |
|--------|--------|----------------|
| Shadow validation rate | 100% | All legacy actions emit events |
| Validation pass rate | >99% | <1% events fail validation |
| Divergence rate | <0.1% | <0.1% of appointments diverge |
| Latency increase | <50ms | Shadow mode adds <50ms |

**Minimum duration: 6 weeks** (at least 2 weeks with 0% divergence rate)

#### 4.3.7 Rollback Phase 2

```typescript
// Rollback: Remove adapter calls from legacy actions
// 1. Comment out adapter invocations in each legacy action
// 2. Redeploy
// 3. No data impact — events already persisted are preserved
```

---

### 4.4 Phase 3: Dual Write (Weeks 15-20)

**Goal:** Orchestrator actively writes new columns. Legacy writes continue to old columns. Both systems coexist.

```
                          PHASE 3 ARCHITECTURE
┌──────────────────────────────┐     ┌──────────────────────────────┐
│  LEGACY PATH (always active) │     │  NEW PATH (feature-flagged)  │
│                               │     │                              │
│  User Action                  │     │  User Action                 │
│       ▼                       │     │       ▼                      │
│  Legacy Server Action         │     │  Orchestrator Command        │
│  (markCompleted, etc.)        │     │                               │
│       ▼                       │     │       ▼                      │
│  Write to old columns         │     │  Validator → Transition      │
│  (status, confirmation_status)│     │       ▼                      │
│       ▼                       │     │  Write to new columns        │
│  Emit event (adapter)         │     │  (booking_status, etc.)      │
│                               │     │       ▼                      │
│                               │     │  Emit event (orchestrator)   │
│                               │     │       ▼                      │
│                               │     │  Trigger side effects        │
│                               │     │  (queues, not async inline)  │
│                               │     │                               │
│                               │     │  NEW_ORCHESTRATOR_ENABLED     │
│                               │     │  = true                      │
└──────────────────────────────┘     └──────────────────────────────┘
         │                                      │
         └──────────────────┬───────────────────┘
                            ▼
            ┌────────────────────────────────────┐
            │       RECONCILIATION JOB            │
            │  Syncs old ← new every 5 minutes   │
            │  Prefers new columns as "truth"     │
            │  Alerts on persistent divergence    │
            └────────────────────────────────────┘
```

#### 4.4.1 Orchestrator Activation

```typescript
// Phase 3: Orchestrator now processes real commands

class AppointmentOrchestrator {
  async executeCommand(command: Command): Promise<CommandResult> {
    // Idempotency check
    const existing = await this.checkIdempotency(command);
    if (existing) return existing;

    // Load state (new columns)
    const currentState = await this.repository.findById(command.appointmentId);
    if (!currentState) throw new AppointmentNotFoundError();

    // Validate
    const permError = this.validator.validatePermission(command, currentState);
    if (permError) return permError;

    const transError = this.validator.validateTransition(command, currentState);
    if (transError) return transError;

    const ruleError = this.validator.validateBusinessRules(command, currentState);
    if (ruleError) return ruleError;

    // Lock
    const locked = await this.acquireLock(command.appointmentId);
    if (!locked) return { success: false, error: { code: 'RESOURCE_LOCKED', ... } };

    try {
      // Compute event type + create event
      const eventType = this.resolveEventType(command);
      const event = await this.createEvent(command, eventType);

      // Compute new state
      const nextState = this.computeNextState(currentState, command, event);

      // Persist to NEW columns
      await this.repository.save(nextState);

      // Register command idempotency
      await this.recordCommandResult(command, event, nextState);

      // Emit for consumers
      await this.eventBus.emit(event);

      // Side effects (async — fail isolated)
      this.triggerSideEffects(event).catch(err =>
        console.error('[ORCHESTRATOR] Side effect failed:', err)
      );

      return { success: true, eventId: event.eventId, newState: nextState };
    } finally {
      await this.releaseLock(command.appointmentId);
    }
  }
}
```

#### 4.4.2 Legacy Sync

```typescript
// Keeps legacy columns in sync with new columns
// This ensures rollback is always possible

async function syncLegacyColumns(
  appointmentId: UUID,
  newState: AppointmentState
): Promise<void> {
  const legacyBooking = mapNewToLegacyBooking(newState.booking);
  const legacyExecution = mapNewToLegacyExecution(newState.execution, newState.completionSource);

  await db.query(`
    UPDATE appointments SET
      status = $2,
      confirmation_status = $3,
      completed_at = $4,
      completed_by = $5,
      confirmed_at = $6,
      confirmed_by = $7,
      price_adjustment = $8,
      payment_method = $9
    WHERE id = $1
  `, [
    appointmentId,
    legacyBooking,
    legacyExecution,
    newState.execution === 'confirmed' ? new Date().toISOString() : null,
    null, // actor ID from event
    // ... etc
  ]);

  logger.info('[SYNC] Legacy columns updated', { appointmentId, legacyBooking, legacyExecution });
}
```

#### 4.4.3 Dual Write Feature Flags

```typescript
export const DUAL_WRITE_FLAGS = {
  // Both paths execute for every action
  NEW_ORCHESTRATOR_ENABLED: true,
  LEGACY_WRITE_ENABLED: true,

  // Read path
  NEW_STATE_READ_ENABLED: false,  // STILL using legacy for reads
  LEGACY_SYNC_ENABLED: true,     // Sync new → old

  // Control
  DUAL_WRITE_RECONCILE: true,    // Run reconciliation job
  DUAL_WRITE_ALERT_DIVERGENCE: true, // Alert on divergence
};
```

#### 4.4.4 User-Facing Impact

| Aspect | Impact |
|--------|--------|
| Performance | +10-30ms per action (two writes + event) |
| Data consistency | Near-real-time sync (≤5min) |
| User experience | Unchanged (reads from legacy columns) |
| Risk | Low — legacy path is still the fallback |

#### 4.4.5 Rollback Phase 3

```
FLIP: NEW_ORCHESTRATOR_ENABLED = false
      LEGACY_WRITE_ENABLED = true
      NEW_STATE_READ_ENABLED = false

EFFECT: Legacy actions become primary again
        Orchestrator stops writing
        Legacy columns are up-to-date (sync was running)
        No data loss
        Rollback time: <1 minute (feature flag)
```

**Monitor for 1 week** after rollback to ensure sync catch-up.

---

### 4.5 Phase 4: Read Prefix (Weeks 21-24)

**Goal:** UI and API reads transition from legacy to new state columns. Old columns still written for backup.

#### 4.5.1 Read Path Migration

```typescript
// Phase 4: Read from new columns, fallback to legacy

async function getAppointment(id: UUID): Promise<Appointment> {
  const row = await db.query(`
    SELECT
      id, organization_id, client_id, employee_id,
      start_time, end_time,
      created_at,

      -- Prefer new columns
      COALESCE(booking_status, map_to_booking_status(status)) AS booking_status,
      COALESCE(execution_status, map_to_execution_status(confirmation_status)) AS execution_status,
      COALESCE(payment_status, 'pending') AS payment_status,
      COALESCE(client_confirmation_source, 'walk_in') AS client_confirmation_source,
      COALESCE(completion_source, 'employee_self') AS completion_source,
      COALESCE(booking_source, 'dashboard') AS booking_source,

      -- Always include legacy for debugging
      status AS legacy_status,
      confirmation_status AS legacy_confirmation_status
    FROM appointments
    WHERE id = $1
  `, [id]);

  return mapRowToAppointment(row.rows[0]);
}
```

#### 4.5.2 UI Component Migration

```typescript
// Phase 4: UI uses new state types

// Before (Phase 0-3):
interface AppointmentLegacyUI {
  status: 'pending' | 'confirmed' | 'completed' | 'canceled' | 'no_show';
  confirmationStatus: 'scheduled' | 'completed' | 'confirmed' | 'needs_review';
}

// After (Phase 4+):
interface AppointmentNewUI {
  bookingStatus: 'active' | 'cancelled' | 'no_show';
  executionStatus: 'scheduled' | 'marked_complete' | 'marked_complete_manually' | 'auto_completed' | 'confirmed';
  paymentStatus: 'pending' | 'collected' | 'refunded';
  clientConfirmationSource: 'token_link' | 'manual_override' | 'walk_in' | 'auto_confirmed';
  completionSource: 'employee_self' | 'manual_staff_override' | 'system_auto';
}
```

#### 4.5.3 Rollback Phase 4

```
FLIP: NEW_STATE_READ_ENABLED = false
      All read paths fall back to COALESCE to legacy columns
      No data change — only reads affected
      Rollback time: <1 minute
```

---

### 4.6 Phase 5: Write Cutover (Weeks 25-28)

**Goal:** Orchestrator becomes the ONLY writer. Legacy actions route through orchestrator.

#### 4.6.1 Legacy Action Migration

```typescript
// Phase 5: Legacy actions become thin wrappers

// Before:
export async function markCompleted(appointmentId: UUID, actorId: UUID, payload: any) {
  const appointment = await db.query(`SELECT * FROM appointments WHERE id = $1`, [appointmentId]);
  // ... 50 lines of business logic
  await db.query(`UPDATE appointments SET confirmation_status = 'completed', ... WHERE id = $1`, [appointmentId]);
  await sendNotification(/* ... */);
  await logAudit(/* ... */);
}

// After:
export async function markCompleted(appointmentId: UUID, actorId: UUID, payload: any) {
  // Route through orchestrator
  const result = await orchestrator.executeCommand({
    type: 'CompleteServiceCommand',
    appointmentId,
    actorId,
    actorRole: 'empleado',
    timestamp: new Date().toISOString(),
    correlationId: generateUUID(),
    commandId: generateUUID(),
    payload,
  });

  if (!result.success) {
    if (result.error.code === 'RESOURCE_LOCKED') {
      // Retry with backoff
      return retry(() => markCompleted(appointmentId, actorId, payload), 3, 1000);
    }
    throw new OrchestratorError(result.error);
  }

  return result;
}
```

#### 4.6.2 Legacy Fallback

```typescript
// Emergency fallback — should never trigger in production

const LEGACY_FALLBACK_ENABLED = false; // Feature flag, emergency only

async function executeWithFallback(command: Command): Promise<CommandResult> {
  try {
    return await orchestrator.executeCommand(command);
  } catch (err) {
    if (LEGACY_FALLBACK_ENABLED) {
      console.error('[FALLBACK] Orchestrator failed, using legacy path:', err);
      await metrics.inc('orchestrator.fallback.triggered');
      return legacyFallback(command);
    }
    throw err;
  }
}
```

#### 4.6.3 Cron Migration

```typescript
// Phase 5: Cron no longer mutates state directly
// Cron emits events → Orchestrator processes

// BEFORE (Phase 0-4):
async function checkReminders() {
  const appointments = await db.query(`
    SELECT id FROM appointments
    WHERE ... AND end_time + INTERVAL '120 minutes' <= NOW()
  `);

  for (const apt of appointments) {
    await db.query(`
      UPDATE appointments
      SET confirmation_status = 'completed', status = 'completed'
      WHERE id = $1
    `, [apt.id]);
  }
}

// AFTER (Phase 5):
async function detectAutoComplete() {
  const candidates = await db.query(`
    SELECT id, end_time
    FROM appointments
    WHERE execution_status = 'needs_review'
    AND end_time + INTERVAL '120 minutes' <= NOW()
    FOR UPDATE SKIP LOCKED
  `);

  for (const apt of candidates) {
    await eventBus.emit(AUTO_COMPLETION_TRIGGERED, {
      appointmentId: apt.id,
      payload: {
        originalEndTime: apt.end_time,
        overdueMinutes: 120,
        // ...
      },
      metadata: {
        source: 'system_auto',
        cronRunId: CURRENT_RUN_ID,
      }
    });
  }
}
```

#### 4.6.4 Rollback Phase 5

```
FLIP: FEATURE_FLAGS.LEGACY_FALLBACK_ENABLED = true
      Actions revert to legacy implementation

CAUTION: If orchestrator was writing new columns and they're the source of truth,
         rollback requires sync catch-up (legacy ← new)

Time: 5-15 minutes (sync catch-up)
Risk: MEDIUM — divergence possible during rollback window
```

---

### 4.7 Phase 6: Legacy Retirement (Weeks 29-32)

**Goal:** Remove legacy columns, adapter layer, cron direct mutations. Archive migration artifacts.

#### 4.7.1 Cleanup Tasks

```typescript
// Task 1: Remove adapter calls from legacy actions
// (actions now fully route through orchestrator)

// Task 2: Drop legacy columns
async function dropLegacyColumns() {
  // Verify data consistency first
  const divergences = await db.query(`
    SELECT COUNT(*) FROM appointments
    WHERE booking_status IS NULL
    OR execution_status IS NULL
  `);

  if (divergences.rows[0].count > 0) {
    // Halt — not all appointments migrated
    throw new Error(`Cannot drop legacy columns: ${divergences.rows[0].count} appointments unmigrated`);
  }

  // Safe to drop
  await db.query(`
    ALTER TABLE appointments
      DROP COLUMN status,
      DROP COLUMN confirmation_status,
      DROP COLUMN completed_at,
      DROP COLUMN completed_by,
      DROP COLUMN confirmed_at,
      DROP COLUMN confirmed_by,
      DROP COLUMN price_adjustment,
      DROP COLUMN payment_method;
  `);
}

// Task 3: Archive migration code
// - Remove src/infrastructure/adapters/
// - Remove backfill scripts
// - Archive to /archive/migration-2026/
```

#### 4.7.2 Final Cleanup Verification

```sql
-- Verify all appointments have complete state
SELECT COUNT(*) AS unmigrated
FROM appointments
WHERE booking_status IS NULL
   OR execution_status IS NULL;

-- Verify no orphan events
SELECT COUNT(*) AS orphaned_events
FROM domain_events e
LEFT JOIN appointments a ON a.id = CAST(e.metadata->>'appointmentId' AS UUID)
WHERE a.id IS NULL;

-- Verify payroll consistency
SELECT a.id, a.execution_status, pi.id AS payroll_item_id
FROM appointments a
LEFT JOIN period_commissions pc ON pc.appointment_id = a.id
WHERE a.execution_status = 'confirmed'
AND pc.id IS NULL;
```

#### 4.7.3 Rollback Phase 6

⚠️ **HIGH RISK** — This is the ONLY phase with irreversible data loss (column removal).

```sql
-- Rollback: Restore from backup
-- Phase 6 should NOT be rolled back. If issues found, restore from full database backup.
```

---

## 5. Rollback Decision Matrix

| Phase | Risk | Rollback Time | Data Loss Risk | Rollback Action |
|-------|------|---------------|----------------|-----------------|
| 1 — Foundation | Low | <5 min | None | Drop new columns |
| 2 — Shadow Mode | Low | <1 min | None | Remove adapter calls |
| 3 — Dual Write | Low | <1 min | None | Feature flag flip |
| 4 — Read Prefix | Low | <1 min | None | Feature flag flip |
| 5 — Write Cutover | Medium | 5-15 min | Potential sync gap | Feature flag + sync |
| 6 — Legacy Retirement | High | Full backup restore | Irreversible | DB restore |

**Rule:** Never proceed past Phase 5 without 2+ weeks of stable operations.

---

## 6. Observability Dashboard

### 6.1 Migration Health Dashboard

```typescript
// Dashboard: /dashboard/migration-health

const MIGRATION_DASHBOARD = {
  panels: [
    {
      title: 'Phase Progress',
      type: 'gauge',
      metrics: [
        'migration.phase': Gauge,         // 1-6
        'migration.phase.name': Gauge,    // String
        'migration.days_in_phase': Gauge, // Days in current phase
      ]
    },
    {
      title: 'State Consistency',
      type: 'stat',
      metrics: [
        'reconciliation.divergences': Gauge,
        'reconciliation.auto_resolved': Counter,
        'reconciliation.manual_needed': Gauge,
      ]
    },
    {
      title: 'Event Health',
      type: 'timeseries',
      metrics: [
        'events.published': Counter,
        'events.consumed': Counter,
        'events.dlq': Counter,
        'events.processing_latency': Histogram,
      ]
    },
    {
      title: 'Command Success Rate',
      type: 'timeseries',
      metrics: [
        'command.success': Counter,
        'command.failure': Counter,
        'command.error_rate': Gauge,      // Percentage
      ]
    },
  ]
};
```

### 6.2 Alerting Rules

| Alert Condition | Severity | Action |
|----------------|----------|--------|
| Divergence rate > 1% | P1 | Immediate investigation |
| Events DLQ > 10 for > 5min | P1 | Check event processing |
| Command error rate > 5% | P2 | Feature flag rollback |
| Shadow validation failure > 5% | P2 | Adapter layer check |
| Reconciliation job missed > 2 cycles | P2 | Cron health check |
| Legacy sync latency > 10min | P3 | Monitor, non-critical |
| Drop in migration phase progress | P3 | Check version flag |

---

## 7. Dependency Loading

```typescript
// Feature flag provider — reads from environment + database

class FeatureFlagProvider {
  async isEnabled(flag: string): Promise<boolean> {
    // 1. Check environment variable (quick override for rollback)
    if (process.env[flag] !== undefined) {
      return process.env[flag] === 'true';
    }

    // 2. Check database (persistent configuration)
    const result = await db.query(`
      SELECT enabled FROM feature_flags WHERE flag = $1
    `, [flag]);

    if (result.rows.length > 0) {
      return result.rows[0].enabled;
    }

    // 3. Default: disabled
    return false;
  }
}

// Feature flag definitions
const FLAGS = {
  // Phase 1
  NEW_COLUMNS_ENABLED: 'MIGRATE_NEW_COLUMNS',

  // Phase 2
  EVENT_STORE_ENABLED: 'MIGRATE_EVENT_STORE',
  SHADOW_MODE_ENABLED: 'MIGRATE_SHADOW_MODE',

  // Phase 3
  NEW_ORCHESTRATOR_ENABLED: 'MIGRATE_NEW_ORCHESTRATOR',
  LEGACY_WRITE_ENABLED: 'MIGRATE_LEGACY_WRITE',
  DUAL_WRITE_RECONCILE: 'MIGRATE_DUAL_WRITE_RECONCILE',

  // Phase 4
  NEW_STATE_READ_ENABLED: 'MIGRATE_NEW_STATE_READ',

  // Phase 5
  NEW_WRITE_CUTOVER_ENABLED: 'MIGRATE_NEW_WRITE_CUTOVER',
  LEGACY_FALLBACK_ENABLED: 'MIGRATE_LEGACY_FALLBACK',

  // Phase 6
  LEGACY_COLUMNS_DROPPED: 'MIGRATE_LEGACY_COLUMNS_DROPPED',
};
```

---

## 8. Testing Strategy per Phase

### 8.1 Unit Tests

| Phase | Coverage | Focus |
|-------|----------|-------|
| 1 | 90%+ | State mapping, validation, orchestration |
| 2 | 80%+ | Adapter emission, shadow execution |
| 3 | 85%+ | Dual write sync, reconciliation |
| 4 | 75%+ | Read fallback, UI compatibility |
| 5 | 80%+ | Orchestrator-as-primary, cron migration |
| 6 | 90%+ | Cleanup safety, archive verification |

### 8.2 Integration Tests

```typescript
describe('Phase 3 — Dual Write', () => {
  it('should write to both legacy and new columns', async () => {
    const command = createCommand('CompleteServiceCommand');
    const result = await orchestrator.executeCommand(command);

    // Verify new columns
    const newRow = await db.query(`
      SELECT execution_status FROM appointments WHERE id = $1
    `, [result.appointmentId]);
    expect(newRow.rows[0].execution_status).toBe('marked_complete');

    // Verify legacy columns
    const legacyRow = await db.query(`
      SELECT confirmation_status FROM appointments WHERE id = $1
    `, [result.appointmentId]);
    expect(legacyRow.rows[0].confirmation_status).toBe('completed');
  });

  it('should survive rollback of new columns', async () => {
    const command = createCommand('CompleteServiceCommand');
    const result = await orchestrator.executeCommand(command);

    // Simulate rollback
    await db.query(`UPDATE appointments SET execution_status = NULL WHERE id = $1`,
      [result.appointmentId]);

    // Verify legacy reads still work
    const legacyRead = await db.query(`
      SELECT confirmation_status FROM appointments WHERE id = $1
    `, [result.appointmentId]);

    expect(legacyRead.rows[0].confirmation_status).toBe('completed');
  });
});
```

### 8.3 Smoke Tests

```typescript
// Smoke tests run against production (or staging) at each phase

async function smokeTestFlowA(): Promise<SmokeTestResult> {
  // 1. Create appointment
  const apt = await createTestAppointment();

  // 2. Mark complete
  const completed = await orchestrator.executeCommand({
    type: 'CompleteServiceCommand',
    appointmentId: apt.id,
    actorId: apt.employeeId,
    actorRole: 'empleado',
    // ...
  });

  // 3. Confirm payment
  const confirmed = await orchestrator.executeCommand({
    type: 'ConfirmPaymentCommand',
    appointmentId: apt.id,
    actorId: adminUserId,
    actorRole: 'admin',
    paymentMethod: 'cash',
    // ...
  });

  return {
    appointmentId: apt.id,
    completed: completed.success,
    confirmed: confirmed.success,
    payrollGenerated: await verifyPayrollEntry(apt.id),
  };
}
```

---

## 9. Cron Migration

### 9.1 Current Cron

```typescript
// CURRENT (Phase 0-4): Direct state mutation
// File: src/actions/cron/runCheckReminders.ts

export async function runCheckReminders() {
  // Rule 1: 5-minute reminders
  // Rule 2: Needs review after 60 min → DIRECT UPDATE
  // Rule 3: Auto-complete after 120 min → DIRECT UPDATE
}
```

### 9.2 Target Cron

```typescript
// TARGET (Phase 5+): Event emission only
// File: src/infrastructure/cron/detectors/AutoCompleteDetector.ts

export async function detectAutoComplete(cronRunId: UUID): Promise<void> {
  const candidates = await db.query(`
    SELECT a.id, a.end_time
    FROM appointments a
    WHERE a.booking_status = 'active'
    AND a.execution_status = 'needs_review'
    AND a.end_time + INTERVAL '120 minutes' <= NOW()
    FOR UPDATE SKIP LOCKED
  `);

  for (const apt of candidates) {
    // DO NOT MUTATE STATE
    // Emit event for orchestrator to handle
    await eventBus.emit({
      eventType: 'AUTO_COMPLETION_TRIGGERED',
      eventId: generateUUID(),
      correlationId: generateUUID(),
      causationId: cronRunId,
      timestamp: new Date().toISOString(),
      source: 'system_auto',
      version: '1.0.0',
      payload: {
        originalEndTime: apt.end_time,
        autoCompleteTime: new Date().toISOString(),
        overdueMinutes: timestampDiff(apt.end_time, new Date()),
        notifySent: true,
        serviceIds: [], // Load from DB if needed
      },
      metadata: {
        actorId: null,
        actorRole: 'system',
        organizationId: apt.organization_id,
        appointmentId: apt.id,
        cronRunId,
        cronClusterId: process.env.CRON_CLUSTER_ID,
      },
    });
  }
}
```

### 9.3 Cron Transition Table

| Current Behavior | Migration Path | Final Behavior |
|-----------------|----------------|----------------|
| Direct `UPDATE appointments SET confirmation_status='needs_review'` | Emit `NEEDS_REVIEW_TRIGGERED` → orchestrator handles transition | Cron emits event only |
| Direct `UPDATE appointments SET status='completed', confirmation_status='completed'` | Emit `AUTO_COMPLETION_TRIGGERED` → orchestrator handles transition | Cron emits event only |
| Send notification inline | Cron emits event → Notification Orchestrator handles | Side effect delegation |
| No idempotency | Event `eventId` enables dedup | Built-in dedup |

---

## 10. Safety Checklist

### 10.1 Pre-Migration Checklist

- [ ] Database backup verified (pg_dump tested)
- [ ] Rollback scripts tested on staging
- [ ] Feature flags deployed with defaults = disabled
- [ ] Reconciliation job deployed but inactive
- [ ] Dashboard panels created
- [ ] Alerts configured for divergence
- [ ] Team trained on rollback procedure
- [ ] Staging environment identical to production schema

### 10.2 Phase Transition Checklist

Phase 1 → 2:
- [ ] All new columns populated from backfill
- [ ] Domain events flowing from adapter layer
- [ ] Shadow orchestrator processing events
- [ ] Divergence rate < 0.1% for 2 weeks

Phase 2 → 3:
- [ ] Shadow validation pass rate > 99%
- [ ] Adapter event emission confirmed for all legacy actions
- [ ] No unexpected validation failures in 2 weeks

Phase 3 → 4:
- [ ] Dual write stable for 2 weeks
- [ ] Reconciliation divergence < 0.001%
- [ ] No rollback incidents during Phase 3

Phase 4 → 5:
- [ ] Read fallback works correctly
- [ ] All UI components display new state correctly
- [ ] No performance regression

Phase 5 → 6:
- [ ] Legacy fallback NOT triggered in 2 weeks
- [ ] Orchestrator only path for all actions
- [ ] Cron emits events only (no direct mutations)

### 10.3 Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| Backend Lead | (designated) | Immediate |
| Database Admin | (designated) | <15 min |
| DevOps | (designated) | <15 min |
| Product Owner | (designated) | <1 hour |

---

## 11. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Orchestrator returns wrong state | Low | High | Feature flag rollback + reconciliation |
| Event bus goes down | Low | Medium | Events persist to DB first, bus is async |
| Dual write race condition | Medium | Medium | Advisory locks prevent concurrent writes |
| Legacy sync misses updates | Medium | Low | Reconciliation job catches within 5min |
| Rollback phase 6 required | Very Low | Critical | Full database restore from backup |
| Team unfamiliar with new model | Medium | Medium | Documentation + pair programming |

---

## 12. Communication Plan

### 12.1 Internal Communications

| Phase | Message | Audience | Channel |
|-------|---------|----------|---------|
| Pre-migration | Architecture RFC review | Engineering | PR + meeting |
| Phase 1 start | "Adding new state columns — zero impact" | Engineering | Slack |
| Phase 2 start | "Shadow mode activated — no changes to operations" | Engineering | Slack |
| Phase 3 start | "Dual write active — monitoring stability" | Engineering + QA | Slack + daily |
| Phase 4 start | "UI reads from new model — test reports please" | Engineering + QA + PM | Slack + weekly |
| Phase 5 start | "Write cutover — emergency fallback available" | Engineering + QA + Ops | Slack + meeting |
| Phase 6 start | "Legacy retirement — final cleanup" | Engineering | Slack |
| Complete | "Migration complete — celebrate!" | All team | Team event |

### 12.2 External Communications

| Phase | Message | Audience |
|-------|---------|----------|
| All phases | "No visible changes for clients/employees" | End users |
| Phase 4 | "Slightly faster page loads" (if applicable) | End users |
| Phase 5 | "More reliable booking confirmations" | End users |

---

## 13. Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| All appointments mapped | 100% | Null check on new columns |
| Divergence-free | 0% for 2 weeks | Reconciliation job |
| No user-reported issues | 0 | Support tickets |
| Zero downtime | 100% uptime | Uptime monitor |
| Rollback never needed | Never used | Feature flag audit log |
| Performance neutral | ±10% latency | APM metrics |
| All events audited | 100% | Event store count vs expected |

---

## 14. Appendix: Legacy State Mapper

```typescript
/////////////////////////////////////////////////////////////
// LEGACY STATE MAPPER
// Used by reconciliation + backfill + read fallback
// Maps old fields (status, confirmation_status) to new model
/////////////////////////////////////////////////////////////

function mapBookingStatus(legacyStatus: string): BookingStatus {
  switch (legacyStatus) {
    case 'pending':
    case 'confirmed':
    case 'completed':
      return 'active';
    case 'canceled':
      return 'cancelled';
    case 'no_show':
      return 'no_show';
    default:
      throw new Error(`Unknown legacy status: ${legacyStatus}`);
  }
}

function mapExecutionStatus(
  legacyStatus: string,
  legacyConfirmationStatus: string
): ServiceExecutionStatus {
  // Flow A: appointments.confirmation_status
  if (legacyConfirmationStatus) {
    switch (legacyConfirmationStatus) {
      case 'scheduled':
      case 'pending_confirmation':
        return 'scheduled';
      case 'completed':
        // 'completed' in confirmation_status = employee marked "Listo"
        return 'marked_complete';
      case 'confirmed':
        // 'confirmed' in confirmation_status = payment collected
        return 'confirmed';
      case 'needs_review':
        return 'scheduled'; // Transient state, maps to base
      default:
        return legacyStatus === 'completed' ? 'auto_completed' : 'scheduled';
    }
  }

  // Fallback: use legacy status field
  switch (legacyStatus) {
    case 'pending':
    case 'confirmed':
      return 'scheduled';
    case 'completed':
      return 'auto_completed';
    case 'canceled':
    case 'no_show':
      return 'scheduled';
    default:
      return 'scheduled';
  }
}

function mapCompletionSource(
  confirmationStatus: string,
  lastEventType: string | null
): CompletionSource {
  if (lastEventType === 'AUTO_COMPLETION_TRIGGERED') {
    return 'system_auto';
  }
  if (lastEventType === 'SERVICE_COMPLETED_MANUALLY' || confirmationStatus === 'completed') {
    return 'manual_staff_override';
  }
  return 'employee_self';
}

function mapClientConfirmationSource(
  legacyStatus: string,
  confirmationStatus: string
): ClientConfirmationSource | null {
  if (legacyStatus === 'confirmed' || confirmationStatus === 'confirmed') {
    return 'walk_in'; // Best guess for legacy data
  }
  return null;
}

/////////////////////////////////////////////////////////////
// REVERSE MAPPER (new → legacy for sync)
/////////////////////////////////////////////////////////////

function mapNewToLegacyBooking(bookingStatus: BookingStatus): string {
  switch (bookingStatus) {
    case 'active': return 'confirmed';
    case 'cancelled': return 'canceled';
    case 'no_show': return 'no_show';
    default: return 'pending';
  }
}

function mapNewToLegacyExecution(
  executionStatus: ServiceExecutionStatus,
  completionSource: CompletionSource | null
): string {
  switch (executionStatus) {
    case 'scheduled': return 'scheduled';
    case 'marked_complete':
    case 'marked_complete_manually':
      return 'completed';
    case 'auto_completed':
      return 'completed';
    case 'confirmed':
      return 'confirmed';
    case 'needs_review':
      return 'needs_review';
    default: return 'scheduled';
  }
}
```

---

**END OF DOCUMENT**
