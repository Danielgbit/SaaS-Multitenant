# Cron Architecture

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Source of Truth](11-source-of-truth.md)  
> **Next:** [Payroll Architecture](13-payroll-architecture.md)  
> **Index:** [README.md](README.md)

---

## Core Principle

Cron jobs become **Event Detectors Only**. They never mutate domain state directly.

```
Current:  Cron → mutate DB → send notifications → repeat
Future:   Cron → detect condition → emit event → orchestrator handles transition
```

## Remainder Cron (`check-reminders`)

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

## Cron Batch Processing Pattern

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

## Distributed Locking

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

## Overlap Prevention

| Mechanism | How It Works |
|---|---|
| **Distributed lock** | PG advisory lock prevents concurrent runs of same cron job |
| **Idempotency check** | Check `domain_events` table for existing event before emitting |
| **Cursor tracking** | Save position in batch to resume after crash |
| **Heartbeat** | If no heartbeat for 2x cron interval, lock is considered stale and can be force-released |

## Cron Job Table

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

## Purge Cron

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

## Navigation

- **Previous:** [Source of Truth](11-source-of-truth.md)
- **Next:** [Payroll Architecture](13-payroll-architecture.md)
- **Index:** [README.md](README.md)
