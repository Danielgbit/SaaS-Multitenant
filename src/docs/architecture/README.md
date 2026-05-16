# Prügressy — Architecture Handbook

> **Version:** 1.0.0  
> **Status:** Active  
> **Author:** Staff+ Backend Architect  
> **Date:** May 2026  

Welcome to the Prügressy Architecture Handbook. This is the authoritative reference for the event-driven architecture, domain events, state machines, orchestration, and operational design of the platform.

---

## Architectural Principles

```
┌────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURAL PRINCIPLES                     │
│                                                                │
│ 1. PostgreSQL is the source of truth.                          │
│    No cache, realtime channel, or read model is authoritative. │
│                                                                │
│ 2. Orchestrators own workflow coordination.                    │
│    Only orchestrators may write domain state.                  │
│    Actions emit events — they do not mutate state.             │
│                                                                │
│ 3. State machines are deterministic and side-effect free.      │
│    They validate transitions. Orchestrators execute them.      │
│                                                                │
│ 4. Cron jobs are event detectors only.                         │
│    They never mutate domain state directly.                    │
│                                                                │
│ 5. Human overrides are first-class operational features.       │
│    Every override is a named event with reason and audit.      │
│                                                                │
│ 6. Domain events represent business reality.                   │
│    Technical events and integration events are separate.       │
│    They never contaminate domain logic.                        │
│                                                                │
│ 7. Listeners never mutate domain state directly.               │
│    They execute side effects. Failures are isolated by DLQ.    │
│                                                                │
│ 8. Payroll processing must be replay-safe.                     │
│    Financial operations use upsert semantics with idempotency. │
│                                                                │
│ 9. Single Writer Principle.                                    │
│    Each domain state boundary has exactly one owner.           │
│                                                                │
│ 10. Effectively-once processing.                               │
│     At-least-once delivery + idempotent consumers.             │
└────────────────────────────────────────────────────────────────┘
```

---

## Recommended Reading Paths

### Backend Engineers (implementing events, orchestrators, listeners)

```
01 → 02 → 06 → 07 → 16 → 17
```

| Step | File | Why |
|---|---|---|
| 1 | [Domain Overview](01-domain-overview.md) | Understand why event-driven |
| 2 | [Domain Events Catalog](02-domain-events.md) | Learn all 22 events and payloads |
| 3 | [State Machines](06-state-machines.md) | Valid transitions and rules |
| 4 | [Orchestrator Architecture](07-orchestrator-architecture.md) | How orchestration works |
| 5 | [Folder Structure](16-folder-structure.md) | Where code goes |
| 6 | [Migration Strategy](17-migration-strategy.md) | How to adopt incrementally |

### Infrastructure / SRE (operational resilience, monitoring, replay)

```
09 → 10 → 11 → 12 → 14 → 15
```

| Step | File | Why |
|---|---|---|
| 1 | [Replay & Idempotency](09-replay-and-idempotency.md) | Effectively-once guarantees |
| 2 | [Failure Classification](10-failure-classification.md) | Error taxonomy, DLQ, escalation |
| 3 | [Source of Truth](11-source-of-truth.md) | What is authoritative, what is derived |
| 4 | [Cron Architecture](12-cron-architecture.md) | Detectors, locks, batch processing |
| 5 | [Observability](14-observability.md) | Monitoring, tracing, stuck workflows |
| 6 | [Event Replay Operations](15-event-replay-operations.md) | Operational replay procedures |

### Product / Operations (domain rules, overrides, payroll)

```
01 → 03 → 04 → 05 → 13
```

| Step | File | Why |
|---|---|---|
| 1 | [Domain Overview](01-domain-overview.md) | High-level architecture |
| 2 | [State Ownership](03-state-ownership.md) | Who owns what |
| 3 | [Transition Authority](04-transition-authority.md) | Who can do what |
| 4 | [Domain Invariants](05-domain-invariants.md) | Rules that must never break |
| 5 | [Payroll Architecture](13-payroll-architecture.md) | Payroll decoupling |

### Full Architecture Review (complete understanding)

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
```

---

## Table of Contents

### Foundation

| # | Document | Description |
|---|---|---|
| 01 | [Domain Overview](01-domain-overview.md) | Why event-driven architecture, problem analysis, three-layer model |
| 02 | [Domain Events Catalog](02-domain-events.md) | All 22 domain events, payload design, envelope structure, DB schema |

### Domain Governance

| # | Document | Description |
|---|---|---|
| 03 | [State Ownership](03-state-ownership.md) | Single Writer Principle, ownership matrix, cross-boundary access rules |
| 04 | [Transition Authority](04-transition-authority.md) | Actor permissions, override rules, audit requirements per transition |
| 05 | [Domain Invariants](05-domain-invariants.md) | HARD vs SOFT invariants, enforcement points, violation response |

### Execution Layer

| # | Document | Description |
|---|---|---|
| 06 | [State Machines](06-state-machines.md) | Deterministic state definitions, valid transitions, separation from orchestrators |
| 07 | [Orchestrator Architecture](07-orchestrator-architecture.md) | Command pipeline, validation, concurrency, event emission, listener architecture |

### Event Infrastructure

| # | Document | Description |
|---|---|---|
| 08 | [Event Classification](08-event-classification.md) | Domain vs Technical vs Integration events, contamination rules |
| 09 | [Replay & Idempotency](09-replay-and-idempotency.md) | Effectively-once processing, idempotency keys, replay safety matrix |
| 10 | [Failure Classification](10-failure-classification.md) | Retryable, transient, permanent, poison, validation, concurrency |
| 11 | [Source of Truth](11-source-of-truth.md) | PostgreSQL authority, read models, eventual consistency rules |

### Subsystems

| # | Document | Description |
|---|---|---|
| 12 | [Cron Architecture](12-cron-architecture.md) | Event detectors only, distributed locking, batch processing |
| 13 | [Payroll Architecture](13-payroll-architecture.md) | Decoupled payroll flow, retry workflow, dead-letter queue |
| 14 | [Observability](14-observability.md) | Audit logging, tracing, monitoring queries, stuck workflow detection |

### Operations

| # | Document | Description |
|---|---|---|
| 15 | [Event Replay Operations](15-event-replay-operations.md) | Replay blast radius, protections, dry-run, approval, procedures |
| 16 | [Folder Structure](16-folder-structure.md) | Recommended file organization, responsibilities, processing flow |

### Migration

| # | Document | Description |
|---|---|---|
| 17 | [Migration Strategy](17-migration-strategy.md) | Strangler Fig pattern, 3-phase migration, rollback strategy, error budget |

---

## Quick Reference

### Event Flow Pattern

```
Action → emit event → INSERT INTO domain_events (status: pending)
                         ↓
                   Consumer polls pending events
                         ↓
                   Orchestrator validates transition
                         ↓
                   UPDATE appointment + INSERT log + UPDATE event status
                         ↓
                   Emit follow-up events
                         ↓
                   Listeners execute side effects
```

### State Transition Quick Reference

| Current State | Event | Target State |
|---|---|---|
| `(pending, scheduled)` | `service.completed` | `(completed, completed)` |
| `(pending, scheduled)` | `service.overdue` | `(completed, needs_review)` |
| `(completed, completed)` | `payment.confirmed` | `(completed, confirmed)` |
| `(completed, needs_review)` | `payment.confirmed` | `(completed, confirmed)` |
| `(completed, needs_review)` | `auto_completion.triggered` | `(completed, completed)` |
| Any non-terminal | `appointment.cancelled` | `(cancelled, cancelled)` |

### Override Events

| Event | Purpose | Actor |
|---|---|---|
| `client.confirmed_manually` | Staff confirms client without client reply | Staff+ |
| `service.completed_manually` | Staff marks service done without employee | Staff+ |
| `price.adjusted` | Staff adjusts price before payment | Staff+ |

---

## Glossary

| Term | Definition |
|---|---|
| **Domain Event** | A record of something that happened in the business domain |
| **Event Envelope** | The standardized wrapper around every event (event_id, correlation_id, etc.) |
| **Correlation ID** | UUID that traces an entire business flow across all events |
| **Causation ID** | The event_id of the event that caused this event |
| **Aggregate** | A cluster of domain objects treated as a unit (e.g., an Appointment) |
| **Orchestrator** | Component that validates transitions and coordinates workflow |
| **Listener** | Component that executes side effects in response to events |
| **Event Detector** | Cron job that detects conditions and emits events (never mutates state) |
| **Dead-Letter Queue** | Storage for events that failed after max retries |
| **Idempotency Key** | Unique key that prevents duplicate processing of the same event |
| **Event Sourcing Light** | Recording events alongside current state (not replacing state) |
| **Strangler Fig Pattern** | Incrementally replacing legacy code with new code alongside it |
| **Single Writer Principle** | Only one orchestrator may own write authority over a specific domain state boundary |
| **Effectively-Once** | At-least-once delivery + idempotent consumers = effectively-once processing |

---

*This handbook replaces the legacy `DOMAIN_EVENT_ARCHITECTURE.md` as the authoritative architecture reference. All new development should reference these documents.*
