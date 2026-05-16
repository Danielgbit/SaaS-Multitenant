# Source of Truth

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Failure Classification](10-failure-classification.md)  
> **Next:** [Cron Architecture](12-cron-architecture.md)  
> **Index:** [README.md](README.md)

---

## Declaration

**PostgreSQL domain tables are the single source of truth.**

No other component, cache, channel, or derived view holds authoritative state. All non-DB representations are derived, ephemeral, or potentially stale.

```
┌────────────────────────────────────────────────────────────────┐
│                    SOURCE OF TRUTH MODEL                        │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POSTGRESQL DOMAIN TABLES (Single Source of Truth)       │   │
│  │  appointments, payroll_periods, period_commissions, ...  │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│          ┌────────────────┼────────────────┐                    │
│          ▼                ▼                ▼                    │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐              │
│  │ domain_    │   │ Supabase   │   │ Next.js    │              │
│  │ events     │   │ Realtime   │   │ Cache      │              │
│  │ (Audit)    │   │ (Ephemeral)│   │ (TTL 5s)   │              │
│  └────────────┘   └────────────┘   └────────────┘              │
│                                                                │
│  All derived. None authoritative. Can be stale.                │
└────────────────────────────────────────────────────────────────┘
```

---

## What IS Source of Truth

| Component | Is Source of Truth? | Description |
|---|---|---|
| `appointments` table | **YES** | All appointment state (status, confirmation_status, payment, timestamps) |
| `employees` table | **YES** | Employee profile, commission rate, contract type |
| `clients` table | **YES** | Client contact info, preferences |
| `payroll_periods` table | **YES** | Payroll period state and totals |
| `payroll_items` table | **YES** | Per-employee payroll calculations |
| `period_commissions` table | **YES** | Individual commission entries |
| `payroll_receipts` table | **YES** | Generated receipts |
| `confirmation_logs` table | **YES** | Audit trail of confirmation actions |

---

## What is NOT Source of Truth

| Component | Not Source of Truth Because | Acceptable Staleness |
|---|---|---|
| `domain_events` table | **Audit log**, not authoritative state. Events record what happened; domain tables record current state. | N/A (append-only log) |
| Supabase Realtime channels | **Ephemeral push**. At-most-once delivery. Events can be missed. | < 1 second (best-effort) |
| Next.js cache (`revalidateTag`) | **Read optimization**. TTL-based. Can serve stale data. | < 5 seconds |
| Browser state / React Query | **Local cache**. Only as fresh as last fetch. | User-dependent |
| Websocket state | **Client-side projection**. Disconnects cause staleness. | Until reconnection |
| Listener in-memory state | **Volatile**. Lost on restart. Not replicated. | N/A |
| Notification queue | **Work queue**, not state storage. Items are consumed and removed. | N/A |
| Dashboard analytics (cached) | **Read model**. Pre-computed from source of truth. | Configurable (minutes-hours) |

---

## Read Models

Read models are derived representations of the source of truth. They exist for performance, scalability, or user experience. They may be stale.

### Realtime Read Models

```
Source of Truth (appointments table)
  │
  └──► Supabase Realtime Channel
        │
        └──► Connected Clients (Dashboard, Confirmation Panel)
              │
              └──► Local state (useState, React Query)
```

| Layer | Staleness | Recovery |
|---|---|---|
| Supabase Realtime | Milliseconds (at-least-once) | Client refreshes on page reload |
| Connected Clients | Real-time (while connected) | Re-connection on disconnect |
| Local state | Until next Realtime event | Manual refresh button |

### Cache Read Models

```
Source of Truth (appointments table)
  │
  ├──► API Route Handler
  │     │
  │     └──► Server Component (RSC)
  │           │
  │           └──► revalidateTag cache
  │
  └──► Server Action
        │
        └──► revalidatePath / revalidateTag
```

| Layer | Staleness | Recovery |
|---|---|---|
| Server Component (RSC) | Until next revalidation | revalidateTag call |
| revalidateTag cache | < 5 seconds (debounced) | Next request after TTL |

### Dashboard Read Models

```
Source of Truth (appointments + payroll tables)
  │
  └──► Analytics Query (aggregated)
        │
        └──► Cached Result
              │
              └──► Dashboard UI
```

| Layer | Staleness | Recovery |
|---|---|---|
| Analytics Query | Per-request | N/A (fresh each time) |
| Cached Result | TTL-based (minutes-hours) | Cache miss → fresh query |

---

## Read Models May Be Stale. Domain State May Not.

This is the foundational rule:

```
┌────────────────────────────────────────────────────────────────┐
│  Read models (cache, realtime, dashboards):                    │
│    → MAY be stale (within acceptable tolerance)                │
│    → MUST never be mistaken for source of truth               │
│    → MUST recover to eventual consistency                     │
│                                                                │
│  Domain state (PostgreSQL tables):                             │
│    → MUST be transactionally consistent                       │
│    → MUST reflect every validated transition                  │
│    → MUST NOT be modified without orchestrator validation     │
└────────────────────────────────────────────────────────────────┘
```

**Implications:**

- A stale Realtime event does NOT mean the database is wrong. The DB is always right.
- A stale cache entry does NOT mean we need to roll back the DB. The DB is always right.
- A client showing stale data does NOT mean the transaction failed. The DB is always right.
- If Realtime delivery fails, refresh from the API. The DB is always right.

---

## Eventual Consistency Rules

| Layer | Consistency Model | SLA | Mechanism |
|---|---|---|---|
| Domain state | **Strong** (transactional) | Immediate | `SELECT ... FOR UPDATE` + atomic commit |
| Realtime | **At-least-once** (best-effort) | < 1s p99 | Supabase Realtime |
| Cache (revalidateTag) | **Eventual** | < 5s p99 | Debounced invalidation |
| Cache (revalidatePath) | **Eventual** | < 500ms | Immediate revalidation |
| Notification delivery | **At-least-once** | < 5min p99 | Queue with retry |
| Payroll processing | **Eventual** | < 1min p99 | Listener with retry |
| Dashboard analytics | **Snapshot** (configurable) | Minutes-hours | Scheduled refresh |

---

## Reconciliation Strategy

### When Reconciliation Is Needed

| Scenario | Trigger | Action |
|---|---|---|
| Realtime event missed on disconnect | Client reconnects | Page refresh → reload from API |
| Cache serves stale data | User reports inconsistency | Manual refresh → cache miss → fresh read |
| Event processing out of order | Listener receives event after another | Orchestrator validates current state, not event order |
| Dead-letter event recovered | Operator replays from DLQ | Event re-emitted → orchestrator validates |
| Replay after incident | Operator initiates replay | Events re-processed in chronological order |

### When Reconciliation Is NOT Needed

| Scenario | Why |
|---|---|
| Read model is behind DB by milliseconds | Acceptable staleness |
| Realtime missed an event but DB is correct | DB is source of truth. UI refresh resolves. |
| Cache invalidation is debounced | 5-second window is intentional performance optimization |
| Notification delivery is delayed | Queue backlog is temporary. Delivery guaranteed. |

### Reconciliation Procedure

```typescript
async function reconcileAppointmentState(appointmentId: string): Promise<void> {
  // 1. Read authoritative state from DB
  const dbState = await db.from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single()

  // 2. Compare with event log reconstruction
  const logState = await reconstructAppointmentState(appointmentId)

  // 3. If mismatch found, log and alert
  if (dbState.status !== logState.status ||
      dbState.confirmation_status !== logState.confirmation_status) {
    console.error('[RECONCILIATION FAILURE]', {
      appointmentId,
      dbState: { status: dbState.status, confirmation_status: dbState.confirmation_status },
      logState: { status: logState.status, confirmation_status: logState.confirmation_status },
    })
    // Alert operator — manual intervention required
  }
}
```

---

## Recovery Procedures

### Stale Cache Recovery

```
1. Admin or system detects stale cache
2. Trigger revalidateTag for affected scope
3. Cache serves fresh data on next request
4. No domain data is lost or corrupted
```

### Stale Realtime Recovery

```
1. Client detects stale state (or user refreshes page)
2. Client fetches fresh data from API
3. Realtime subscription resumes
4. No domain data is lost or corrupted
```

### Domain State Corruption Recovery

```
1. CRITICAL. Freeze affected workflows.
2. Use event log to reconstruct correct state.
3. Execute compensating transition via orchestrator.
4. Verify recovery with reconciliation query.
5. Root cause analysis required.
```

---

## Domain State vs Event Log

| Aspect | Domain Tables (`appointments`, etc.) | Event Log (`domain_events`) |
|---|---|---|
| **Purpose** | Current state | History of changes |
| **Mutability** | Mutable (updated on each transition) | Immutable (append-only) |
| **Source of truth** | **YES** | NO |
| **Consistency** | Strong (transactional) | Eventual (async emission) |
| **Used by** | Orchestrators, Listeners, Actions, UI | Audit, Debugging, State Reconstruction |
| **Retention** | Indefinite | Indefinite |
| **Can be replayed** | N/A | Yes (to reconstruct state) |
| **Can be repaired** | Yes (on incident) | No (append corrections only) |

---

## Navigation

- **Previous:** [Failure Classification](10-failure-classification.md)
- **Next:** [Cron Architecture](12-cron-architecture.md)
- **Index:** [README.md](README.md)
