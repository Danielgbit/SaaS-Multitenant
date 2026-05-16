# Event Replay Operations

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Observability](14-observability.md)  
> **Next:** [Folder Structure](16-folder-structure.md)  
> **Index:** [README.md](README.md)

---

## Operational Replay Philosophy

Replay is a **controlled operation**, not a casual action. Every replay must be justified, scoped, and audited.

```
┌────────────────────────────────────────────────────────────────┐
│                  REPLAY PHILOSOPHY                              │
│                                                                │
│  Replay is a RECOVERY operation.                               │
│  It is NOT a retry mechanism.                                  │
│  It is NOT a debugging tool (use event log queries instead).   │
│  It is NOT a way to re-send notifications.                     │
│                                                                │
│  Replay should be:                                             │
│    - Rare (incidents only)                                     │
│    - Scoped (single event or small batch)                      │
│    - Audited (every replay is logged)                          │
│    - Protected (rate-limited, requires approval)               │
└────────────────────────────────────────────────────────────────┘
```

---

## When Replay Is Allowed

| Scenario | Allowed | Example |
|---|---|---|
| Payroll dead-letter recovery | ✅ **Yes** | `payroll.generation_requested` failed after 3 retries. Replay after fixing root cause. |
| Stuck workflow recovery | ✅ **Yes** | Appointment completed but `payroll.generation_requested` was never emitted. Replay the event. |
| Data recovery after incident | ✅ **Conditional** | System crash caused event loss. Replay from last known good state. Requires incident post-mortem. |
| Debugging / testing | ✅ **Conditional** | In staging environment only. Never in production without isolation. |
| Re-sending notifications | ❌ **No** | Use notification-specific retry mechanism, not event replay. |
| Fixing user error | ❌ **No** | User errors require compensating actions, not event replay. |
| Re-processing rejected transitions | ❌ **No** | Rejection means business rule violation. Replay will fail again. |
| Bulk replay without scope | ❌ **No** | Every replay must have a defined scope and blast radius. |

---

## When Replay Is NOT Allowed

```
╔══════════════════════════════════════════════════════════════════╗
║                    REPLAY PROHIBITIONS                           ║
╠══════════════════════════════════════════════════════════════════╣
║ 1. NEVER replay notification.requested to re-send messages      ║
║ 2. NEVER replay events that were already successfully processed ║
║ 3. NEVER replay bulk without throttle and dry-run               ║
║ 4. NEVER replay across environment boundaries (prod→staging)    ║
║ 5. NEVER replay without audit logging enabled                   ║
║ 6. NEVER replay events older than 30 days                       ║
║ 7. NEVER replay state_transition.rejected events                ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Replay Blast Radius

Every replay has a blast radius — the set of systems, users, and data affected by re-emitting the event.

### Per-Event Blast Radius

| Event | Blast Radius | Risk Level |
|---|---|---|
| `payroll.generation_requested` | Single appointment's payroll entry. Upsert prevents duplicates. Financial recalculation. | 🟢 Low (idempotent) |
| `payroll.receipt_requested` | Single employee's receipt for a period. May regenerate PDF. | 🟢 Low (replaces draft) |
| `payment.confirmed` | Single appointment state transition. Orchestrator validates. May re-trigger payroll. | 🟡 Medium (re-triggers payroll) |
| `service.completed` | Single appointment state transition. Orchestrator validates. May re-trigger notifications. | 🟡 Medium (re-triggers notifications) |
| `notification.requested` | Client receives duplicate message. Cost per message. Brand reputation impact. | 🔴 **High** (cost + reputation) |
| `calendar.refresh_requested` | Cache invalidation. Time-window dedup renders replay harmless. | 🟢 Low (no-op after window) |
| `appointment.created` | Would attempt to create duplicate appointment. Orchestrator blocks. | 🟢 Low (blocked by orchestrator) |
| `appointment.cancelled` | Would attempt to cancel already-cancelled appointment. Orchestrator blocks. | 🟢 Low (blocked by orchestrator) |

### Blast Radius Controls

| Control | Description |
|---|---|
| **Scoping** | Replay must specify exact event_id or filter (event_name + date_range + aggregate_id) |
| **Throttling** | Max 100 replays per hour per organization |
| **Dry-run** | Replay in preview mode — show what WOULD happen without executing |
| **Approval** | Admin approval required for bulk replays (>10 events) or high-risk event types |
| **Audit** | Every replay attempt is logged with operator identity and scope |

---

## Replay Procedures

### Single Event Replay (Dead-Letter Recovery)

```typescript
async function replayPayrollEvent(deadLetterId: string): Promise<void> {
  // 1. Load dead-letter entry
  const entry = await db.from('payroll_dead_letter')
    .select('*')
    .eq('id', deadLetterId)
    .single()

  // 2. Validate replay is allowed
  if (entry.status !== 'pending') {
    throw new Error(`Dead-letter entry ${deadLetterId} is not in pending status`)
  }

  // 3. Reset the original event and re-emit
  await db.from('domain_events')
    .update({ status: 'pending', retry_count: 0, last_error: null })
    .eq('event_id', entry.original_event_id)

  // 4. Emit fresh event with same payload
  await emit(entry.payload.event_name, entry.payload, {
    retry_attempt: 0,
    is_replay: true,
    dead_letter_id: deadLetterId,
    original_event_id: entry.original_event_id,
  })
}
```

### Batch Replay (Filter-Based)

```typescript
interface ReplayRequest {
  event_name?: DomainEventName[]
  organization_id?: string
  aggregate_id?: string
  date_from?: string
  date_to?: string
  status?: 'failed' | 'dead_lettered'
  reason: string        // REQUIRED — why is this replay needed?
}

async function batchReplay(request: ReplayRequest): Promise<ReplayResult> {
  // 1. Validate permissions (admin+ only)
  // 2. Validate reason (non-empty, meaningful)
  // 3. Throttle check (< 100 replays/hour for org)
  // 4. Load matching events
  // 5. Run dry-run validation
  // 6. If dry-run passes, execute replay with progress tracking
  // 7. Log all replay attempts
  // 8. Return result summary
}
```

### Replay Categories

| Category | Mechanism | Approval | Throttle | Dry-Run |
|---|---|---|---|---|
| **Payroll dead-letter** | Single event by dead_letter_id | Auto (operator) | 100/hour | Optional |
| **Payroll batch** | Filter by period + employee_id | Admin required | 50/hour | Required |
| **Notification dead-letter** | Single event by dead_letter_id | Admin required | 10/hour | Required |
| **Stuck workflow** | Single appointment by aggregate_id | Auto (operator) | 50/hour | Optional |
| **Data recovery (incident)** | Filter by date range + event type | **Owner approval** | 1000/day | Required |

---

## Replay Protections

| Protection | Implementation |
|---|---|
| **Replay guard** | `domain_events.idempotency_key` UNIQUE constraint prevents duplicate processing |
| **Replay audit** | Every replay sets `metadata.is_replay = true` in the re-emitted event |
| **Replay rate limit** | Max 100 replays per hour per organization. Max 1000 per day globally. |
| **Replay window** | Max 30 days back from current date. Older events require manual SQL recovery. |
| **Replay approval** | Events with `risk_level: HIGH` (notifications) require admin approval before replay. |

```sql
-- Replay guard query: check if event was already replayed
SELECT COUNT(*) as replay_attempts
FROM domain_events
WHERE correlation_id = (
  SELECT correlation_id FROM domain_events WHERE event_id = :original_event_id
)
AND metadata->>'is_replay' = 'true'
AND metadata->>'original_event_id' = :original_event_id;
```

---

## Replay Auditing

Every replay is recorded with full context:

```typescript
interface ReplayAuditEntry {
  id: string
  replayed_event_id: string        // original event that was replayed
  replayed_event_name: string
  replayed_at: string
  replayed_by: string              // operator user_id
  replayed_by_role: string
  reason: string                   // REQUIRED justification
  blast_radius: string             // scope description
  status: 'pending' | 'completed' | 'failed'
  result: Record<string, unknown>  // replay outcome
  dry_run_result?: Record<string, unknown>
  organization_id: string
  created_at: string
}
```

---

## Replay Console (Future-Ready Design)

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `POST /api/events/replay` | POST | Single event replay by event_id |
| `POST /api/events/replay/batch` | POST | Batch replay with filters |
| `POST /api/events/replay/dry-run` | POST | Preview replay without executing |
| `GET /api/events/replay/status` | GET | List active and recent replays |
| `GET /api/events/replay/history` | GET | Full replay audit log |

### UI Components (Future)

```
ReplayPanel
├── DeadLetterTable (shows failed events with retry status)
├── ReplayForm (event_id input, reason, dry-run toggle)
├── ReplayHistoryTimeline (chronological replay log)
└── BlastRadiusPreview (shows affected appointments/notifications)
```

---

## Payroll Replay Strategy (Operational)

The existing replay strategy for payroll dead-letter events:

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

**Operational procedure for payroll replay:**

```
1. Operator identifies failed payroll event in dead-letter queue
2. Operator investigates root cause (check DB, check appointment state)
3. If root cause is resolved (e.g., DB connection restored):
   a. Operator replays single event via admin console
   b. PayrollListener processes and emits payroll.generated
   c. Operator verifies payroll entry exists
4. If root cause is NOT resolved:
   a. Do NOT replay
   b. Escalate to development team
   c. Root cause must be fixed before replay
```

---

## Dry-Run Mode

Before executing a replay, operators SHOULD run a dry-run to preview the impact:

```typescript
async function dryRunReplay(eventId: string): Promise<DryRunResult> {
  const event = await db.from('domain_events')
    .select('*')
    .eq('event_id', eventId)
    .single()

  // 1. Load current state of affected aggregate
  const currentState = await readAggregateState(event.aggregate_id, event.aggregate_type)

  // 2. Run validation (but do NOT execute transition)
  const validation = validateTransition(
    currentState,
    event.event_name,
    event.actor_role
  )

  // 3. Predict what would happen
  return {
    would_process: validation.valid,
    current_state: currentState,
    target_state: validation.valid ? computeTargetState(event.event_name) : null,
    would_emit: validation.valid ? getFollowUpEvents(event.event_name) : [],
    rejection_reason: validation.valid ? null : validation.reason,
  }
}
```

---

## Replay Risks and Mitigations

| Risk | Scenario | Mitigation |
|---|---|---|
| **Duplicate commission** | Payroll event replayed after original already succeeded | Upsert with `ignoreDuplicates` prevents double-entry |
| **Duplicate notification** | Notification event replayed | Idempotency_key on queue prevents re-queue. But if original was already sent, replay creates new queue entry with different key. → HIGH RISK. |
| **State corruption** | Out-of-order replay skips intermediate states | Orchestrator validates current state before applying. Invalid transitions are rejected. |
| **Cache stampede** | Mass replay triggers mass cache invalidation | CacheInvalidationListener debounces. But many parallel replays could spike DB load. |
| **Financial miscalculation** | Price changed between original and replay | Orchestrator uses current appointment data, not event payload, for payroll calculation. |
| **Overloaded listener** | Batch replay floods PayrollListener | Throttle at 50/hour for payroll. Backpressure via queue depth monitoring. |

---

## Navigation

- **Previous:** [Observability](14-observability.md)
- **Next:** [Folder Structure](16-folder-structure.md)
- **Index:** [README.md](README.md)
