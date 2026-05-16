# Domain Overview

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [README.md](README.md) (index)  
> **Next:** [Domain Events Catalog](02-domain-events.md)  
> **Index:** [README.md](README.md)

---

## 1.1 Why the Current Architecture Is Dangerous

The current Prügressy architecture violates the **Single Responsibility Principle** at every layer. Business logic is scattered across four concerns with no clear boundaries:

| Concern | Where It Lives | The Problem |
|---------|---------------|-------------|
| State mutation | Actions, Cron jobs, API routes | No single source of truth for transitions |
| Side effects | Actions (fire-and-forget payroll) | Silent failures, no retries, no observability |
| Notifications | Actions, Cron jobs, Orchestrator | Coupled to business logic, duplicated conditions |
| Cache invalidation | Spread across 5+ calls per action | Brittle, misses edge cases, duplicated try/catch |

**Concrete evidence from the codebase:**

1. **`confirmService.ts` lines 174-179:** Payroll is fire-and-forget via dynamic import. If `addAppointmentToPayroll` fails, the appointment is already marked as confirmed, payment was registered, but payroll entry is silently lost. The system loses revenue data with zero audit trail.

2. **`runCheckReminders.ts` lines 129-132 and 187-194:** The cron job directly mutates `confirmation_status` and `status` on appointments. This bypasses all validation, authorization, and event logging. A cron bug could corrupt the entire appointment state.

3. **`markCompleted.ts` lines 126-169:** A single action performs: state mutation + confirmation log + notification creation + cache invalidation. Each of these is a separate concern with different failure modes, but they are coupled into a single transaction with no rollback strategy.

4. **`markManually.ts` lines 103-165:** Same pattern — mutates state, creates appointment_confirmations, sends notifications, invalidates cache. Duplicated logic from `markCompleted.ts` with slight variations that will inevitably diverge.

5. **`adjustPrice.ts`:** Creates log, mutates state, invalidates cache. No event emitted. If a price adjustment affects payroll, there is no mechanism to recalculate.

### 1.2 Why Side Effects Are Coupled

Every Server Action in Prügressy follows this pattern:

```
validate input → authorize user → mutate DB → log → notify → invalidate cache → fire-and-forget payroll
```

This is problematic because:

- **No isolation:** A failed notification blocks the state mutation? No — but the error is silently caught (`console.warn`). This means partial failures are invisible.
- **No ordering guarantees:** Payroll is kicked off via `import(...).then(...)` with no ordering relative to other side effects.
- **No idempotency:** If `confirmService` is called twice (UI double-click), the payroll insertion uses `upsert` with `ignoreDuplicates`, but notifications and logs are duplicated.
- **No replay capability:** If payroll needs to be regenerated, there is no event history to replay. The only option is to manually recalculate.

### 1.3 Why Cron Mutations Are Problematic

The `runCheckReminders.ts` cron performs three distinct mutations:

1. **Reminder phase:** Inserts `notifications` directly — no event, no orchestrator validation.
2. **Alert phase:** Mutates `confirmation_status` from `scheduled` to `needs_review` — bypasses transition validation.
3. **Auto-complete phase:** Mutates `confirmation_status` to `completed` and `status` to `completed` — bypasses all business rules.

Each of these should be an **event emission** that triggers the orchestrator to validate and execute the transition. Currently:

- There is no way to audit that the cron caused a state change (the `confirmation_logs` insert in auto-complete is inconsistent — reminders and alerts have no logs).
- There is no way to prevent double-processing (the cron has no distributed locking).
- There is no dead-letter handling if a mutation fails halfway through a batch.

### 1.4 Why Event-Driven Architecture Fits This Domain

Prügressy operates in a domain that is **inherently event-driven**:

| Business Event | Natural Occurrence |
|---------------|-------------------|
| Client books | Triggered once per appointment |
| Employee completes service | Triggered once per service completion |
| Payment confirmed | Triggered once per payment |
| 60 minutes elapsed | Time-triggered boundary |
| 120 minutes elapsed | Time-triggered boundary |
| Payroll period ends | Time-triggered boundary |

The domain **already thinks in events** — the problem is the codebase does not formalize them. Every "trigger" in the business logic is an event waiting to be modeled.

Benefits of formalizing:

| Benefit | Why It Matters for Prügressy |
|---------|------------------------------|
| **Deterministic state transitions** | Every state change is validated by the orchestrator, not by the action |
| **Observable workflows** | Each appointment lifecycle can be replayed from the event log |
| **Isolated failures** | Payroll failure does not affect payment confirmation |
| **Resilient side effects** | Notifications, payroll, cache invalidation become retryable listeners |
| **Audit completeness** | Every state change has a corresponding event with full metadata |
| **Safe timeouts** | Cron emits events; orchestrator validates transitions |
| **Manual override traceability** | Overrides become named events with actor, reason, and timestamp |

### 1.5 How Workflows Should Be Orchestrated

The new architecture follows a strict **three-layer model**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         ACTIONS                                 │
│  (User-facing Server Actions)                                   │
│  Responsibilities: validate input, authorize, emit event        │
│  DO NOT: mutate state directly, execute side effects            │
├─────────────────────────────────────────────────────────────────┤
│                      ORCHESTRATOR                               │
│  (AppointmentOrchestrator)                                      │
│  Responsibilities: validate transitions, emit follow-up events  │
│  DO NOT: execute side effects, send notifications               │
├─────────────────────────────────────────────────────────────────┤
│                       LISTENERS                                 │
│  (PayrollListener, NotificationListener, AuditListener, etc.)   │
│  Responsibilities: execute side effects, handle retries         │
│  DO NOT: mutate domain state, validate business rules           │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**

```
User Action
  ↓ emit
Domain Event
  ↓ persist
Event Store (DB)
  ↓ fan-out
Orchestrator  →  validates transition  →  emits result event
  ↓
Listeners  →  execute side effects  →  handle failures independently
```

Each layer has explicit responsibilities and strict boundaries:

| Layer | Reads State | Writes State | Emits Events | Has Retries |
|-------|-------------|--------------|--------------|-------------|
| Action | Yes (read) | No | Yes | No |
| Orchestrator | Yes (validate) | Yes (transition) | Yes | Yes |
| Listener | Yes (read) | No (writes own data) | No | Yes |

---

## Appendix: Supabase Integration Points

| Component | Supabase Feature | Purpose |
|-----------|-----------------|---------|
| Event bus | `pg_notify` + LISTEN | Real-time event notification to consumer |
| Event store | `domain_events` table | Persistent event log |
| Distributed lock | Advisory lock or `cron_state` table | Prevent concurrent cron execution |
| Orchestrator | `SELECT ... FOR UPDATE` | Pessimistic locking for state transitions |
| Listener | `UPDATE ... WHERE id = ANY(...)` | Batch claim pending events |
| Dead-letter | `payroll_dead_letter` table | Failed event storage |
| Audit | `domain_events` table | Queryable event history |

---

## Navigation

- **Previous:** [README.md](README.md) (index)
- **Next:** [Domain Events Catalog](02-domain-events.md)
- **Index:** [README.md](README.md)
