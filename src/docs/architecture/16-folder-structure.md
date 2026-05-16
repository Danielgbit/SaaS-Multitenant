# Folder Structure

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Event Replay Operations](15-event-replay-operations.md)  
> **Next:** [Migration Strategy](17-migration-strategy.md)  
> **Index:** [README.md](README.md)

---

## Architecture Overview

```
src/
├── core/                          # ← NEW: Domain architecture
│   ├── events/
│   │   ├── registry.ts            # EventRegistry — central event catalog
│   │   ├── emitter.ts             # EventEmitter — emit and fan-out
│   │   ├── consumer.ts            # EventConsumer — poll and dispatch
│   │   ├── retry.ts               # Retry policies + exponential backoff
│   │   ├── types.ts               # DomainEvent, DomainEventName, etc.
│   │   └── validators/            # Zod schemas per event
│   │       ├── appointment.events.ts
│   │       ├── payment.events.ts
│   │       ├── payroll.events.ts
│   │       ├── notification.events.ts
│   │       └── cron.events.ts
│   │
│   ├── orchestrators/
│   │   ├── appointment.orchestrator.ts  # Appointment state machine
│   │   ├── payroll.orchestrator.ts      # Payroll workflow
│   │   ├── transition-map.ts            # VALID_TRANSITIONS definition
│   │   └── transition-validator.ts      # Transition validation logic
│   │
│   ├── listeners/
│   │   ├── payroll.listener.ts      # PAYROLL_GENERATION_REQUESTED handler
│   │   ├── notification.listener.ts # NOTIFICATION_REQUESTED handler
│   │   ├── audit.listener.ts        # Universal event recorder
│   │   ├── cache-invalidation.listener.ts  # Calendar/tag invalidation
│   │   ├── realtime.listener.ts     # Supabase Realtime bridge
│   │   └── registry.ts              # ListenerRegistry
│   │
│   ├── state-machine/
│   │   ├── appointment-states.ts    # State definitions + transitions
│   │   ├── payroll-states.ts        # Payroll period states
│   │   └── types.ts                 # Shared state types
│   │
│   ├── cron/
│   │   ├── detectors/
│   │   │   ├── reminder.detector.ts     # Phase 1: 5-min reminders
│   │   │   ├── overdue.detector.ts      # Phase 2: 60-min overdue
│   │   │   ├── auto-complete.detector.ts # Phase 3: 120-min auto-complete
│   │   │   ├── purge.detector.ts        # Data retention purge
│   │   │   └── payroll-period.detector.ts # End-of-period detection
│   │   ├── base-detector.ts         # Shared detector pattern
│   │   ├── lock.ts                  # Distributed locking (PG advisory)
│   │   ├── cursor.ts                # Pagination cursor management
│   │   └── types.ts                 # Cron types
│   │
│   ├── dead-letter/
│   │   ├── payroll.dlq.ts           # Payroll dead-letter management
│   │   ├── notification.dlq.ts      # Notification dead-letter management
│   │   └── reconciliation.ts        # DLQ cleanup + replay tools
│   │
│   ├── audit/
│   │   ├── event-logger.ts          # domain_events table writer
│   │   ├── consistency-checker.ts   # Validate legacy ↔ event parity
│   │   ├── reconstructor.ts         # State reconstruction from events
│   │   └── queries.ts               # Common audit SQL queries
│   │
│   └── migration/
│       ├── feature-flags.ts         # EVENT_DRIVEN_ENABLED flags
│       ├── adapters/
│       │   ├── legacy-action-adapter.ts  # Wraps legacy actions to emit events
│       │   └── cron-adapter.ts           # Wraps legacy cron to emit events
│       └── consistency-validator.ts      # Phase 1 validation
│
├── actions/                        # ← EXISTING (refactored to emit events)
│   ├── confirmations/
│   │   ├── confirmService.ts       # REFACTORED: emit → orchestrator handles
│   │   ├── markCompleted.ts        # REFACTORED: emit → orchestrator handles
│   │   ├── markManually.ts         # REFACTORED: emit OVERRIDE event
│   │   ├── adjustPrice.ts          # REFACTORED: emit price.adjusted
│   │   ├── cancelConfirmation.ts   # REFACTORED: emit appointment.cancelled
│   │   └── ... (unchanged schema, token files)
│   ├── cron/
│   │   └── runCheckReminders.ts    # REFACTORED: emit-only, no mutations
│   ├── payroll/
│   │   ├── addAppointmentToPayroll.ts # MOVED: logic to PayrollListener
│   │   └── ... (receipt generation stays)
│   └── ... (other actions mostly unchanged)
│
├── lib/                            # ← EXISTING (mostly unchanged)
│   ├── supabase/
│   ├── notifications/
│   └── payroll/
│
├── app/api/
│   ├── cron/
│   │   ├── process-notifications/route.ts  # ← EXISTING
│   │   ├── check-reminders/route.ts         # ← EXISTING (calls detector)
│   │   └── purge-appointments/route.ts     # ← EXISTING (calls detector)
│   └── events/
│       ├── emit/route.ts           # HTTP endpoint for external event emission
│       └── replay/route.ts         # HTTP endpoint for event replay (admin)
│
├── types/
│   └── domain-events.ts            # TypeScript types for all events
│
└── docs/
    └── DOMAIN_EVENT_ARCHITECTURE.md  # Legacy document
```

## File Responsibilities

| File | Responsibility | Read/Write |
|---|---|---|
| `core/events/emitter.ts` | Emit events to the event bus (DB + notifications) | Write events |
| `core/events/consumer.ts` | Poll domain_events table, dispatch to listeners | Read events |
| `core/events/registry.ts` | Central catalog of all events with schemas | Read (config) |
| `core/orchestrators/appointment.orchestrator.ts` | Validate transitions, mutate state, emit follow-ups | Write state + events |
| `core/orchestrators/payroll.orchestrator.ts` | Payroll period lifecycle | Write payroll |
| `core/listeners/payroll.listener.ts` | Add appointment to payroll on PAYMENT_CONFIRMED | Write payroll |
| `core/listeners/notification.listener.ts` | Queue and send notifications | Write queue |
| `core/listeners/cache-invalidation.listener.ts` | Invalidate Next.js cache | Write cache (RPC) |
| `core/audit/event-logger.ts` | Record all events to domain_events table | Write events |
| `core/cron/detectors/*.ts` | Detect conditions, emit events | Read state, Write events |
| `core/dead-letter/*.ts` | Manage failed events | Read/write DLQ |
| `core/migration/*.ts` | Legacy compatibility during migration | Dual-write |

## Event Processing Flow

```
1. TRIGGER: User action, Cron detector, Webhook
   ↓
2. EMIT: core/events/emitter.ts
   ├── INSERT INTO domain_events (status: 'pending')
   └── NOTIFY pg_notify('domain_events', event_id)
   ↓
3. CONSUME: core/events/consumer.ts
   ├── LISTEN pg_notify OR poll domain_events WHERE status = 'pending'
   ├── UPDATE status = 'processing'
   ├── Route to orchestrator (if state transition event)
   └── Route to listeners (if side-effect event)
   ↓
4. ORCHESTRATE: core/orchestrators/
   ├── SELECT ... FOR UPDATE (lock entity)
   ├── Validate transition
   ├── Execute state mutation
   ├── INSERT confirmation_logs
   ├── UPDATE domain_events SET status = 'completed'
   └── Emit follow-up events
   ↓
5. LISTEN: core/listeners/
   ├── Execute side effect (payroll, notification, cache)
   ├── On success: no action (event already 'processing')
   └── On failure: retry or move to DLQ
```

---

## Navigation

- **Previous:** [Event Replay Operations](15-event-replay-operations.md)
- **Next:** [Migration Strategy](17-migration-strategy.md)
- **Index:** [README.md](README.md)
