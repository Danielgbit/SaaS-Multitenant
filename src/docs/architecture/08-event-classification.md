# Event Classification

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Orchestrator Architecture](07-orchestrator-architecture.md)  
> **Next:** [Replay & Idempotency](09-replay-and-idempotency.md)  
> **Index:** [README.md](README.md)

---

## Three Categories

Events in Prügressy are classified into three formal categories. Each category has different guarantees, persistence requirements, and replay capabilities.

```
┌────────────────────────────────────────────────────────────────┐
│                    EVENT CLASSIFICATION                        │
│                                                                │
│  ┌────────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │                    │  │              │  │               │  │
│  │   DOMAIN EVENTS    │  │  TECHNICAL   │  │  INTEGRATION  │  │
│  │                    │  │   EVENTS     │  │    EVENTS     │  │
│  │  Business reality  │  │  Infra needs │  │  Ext systems  │  │
│  │                    │  │              │  │               │  │
│  │  Persist: YES      │  │  Persist: NO │  │  Persist: OPT │  │
│  │  Replay: YES       │  │  Replay: NO  │  │  Replay: COND │  │
│  │  Affects state: YES│  │  Affects: NO │  │  Affects: NO  │  │
│  └────────────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Domain Events

Domain events represent **business reality**. Something happened in the business that matters.

| Property | Value |
|---|---|
| **Definition** | Records a business fact that occurred in the domain |
| **Emitted by** | Actions (user-triggered), Cron detectors (time-triggered), Orchestrators (transition-triggered) |
| **Consumed by** | Orchestrators (for state transitions), AuditListener (for recording) |
| **Replayable** | **YES** — replaying a domain event should reproduce the same state change |
| **Affects domain state** | **YES** — domain events cause state transitions |
| **Must persist** | **YES** — `domain_events` table is append-only permanent log |
| **Idempotency** | Required — each event must be processable at least once |

### Domain Event Catalog

| Event Name | Category Within Domain | Emitted By |
|---|---|---|
| `appointment.created` | Booking | Action |
| `appointment.rescheduled` | Booking | Action |
| `appointment.cancelled` | Booking | Action |
| `client.confirmed` | Confirmation | Inbound processor |
| `client.confirmed_manually` | Confirmation | Action |
| `client.cancelled` | Confirmation | Inbound processor |
| `service.completed` | Execution | Action |
| `service.completed_manually` | Execution | Action |
| `service.overdue` | Execution | Cron detector |
| `auto_completion.triggered` | Execution | Cron detector |
| `payment.confirmed` | Payment | Action |
| `price.adjusted` | Payment | Action |
| `payroll.generation_requested` | Payroll | Orchestrator |
| `payroll.generated` | Payroll | Listener |
| `payroll.failed` | Payroll | Listener |
| `payroll.receipt_requested` | Payroll | Action / Cron |
| `payroll.period_closed` | Payroll | Action |
| `appointment.execution_completed` | Lifecycle | Orchestrator |
| `state_transition.rejected` | Lifecycle | Orchestrator |

### Domain Event Rules

```
1. Every domain event has a clear business meaning
2. Every domain event maps to a state machine transition (or rejection)
3. Domain events are immutable once recorded
4. Domain events are NOT deleted (append-only)
5. Replaying domain events reconstructs business state
```

---

## Technical Events

Technical events represent **infrastructure needs**. Something needs to happen in the system to maintain consistency.

| Property | Value |
|---|---|
| **Definition** | Records an infrastructure coordination need |
| **Emitted by** | Orchestrators (after transitions), Cron detectors |
| **Consumed by** | Listeners (CacheInvalidationListener, RealtimeListener) |
| **Replayable** | **NO** — time-sensitive. Replaying a cache invalidation from 5 minutes ago is pointless. |
| **Affects domain state** | **NO** — technical events never change business state |
| **Must persist** | **NO** — best-effort delivery. If lost, domain state is unaffected. |
| **Idempotency** | Nice-to-have, but time-window dedup is acceptable |

### Technical Event Catalog

| Event Name | Purpose | Emitted By | Consumed By |
|---|---|---|---|
| `calendar.refresh_requested` | Invalidate calendar cache | Orchestrator | CacheInvalidationListener |
| `cache.invalidation_requested` | Invalidate specific cache tag | Orchestrator | CacheInvalidationListener |

### Technical Event Rules

```
1. Technical events NEVER contain domain logic
2. Technical events MAY be dropped under load (backpressure)
3. Technical events MUST NOT trigger domain state transitions
4. Technical events SHOULD be batched/debounced for efficiency
5. Technical events are RECOVERABLE by polling (next page load will get fresh data)
```

---

## Integration Events

Integration events represent **external system boundaries**. Data is being sent to or received from external systems.

| Property | Value |
|---|---|
| **Definition** | Records communication with an external system |
| **Emitted by** | Listeners (after processing), Webhook handlers (on inbound), Sync adapters |
| **Consumed by** | External providers (WhatsApp, Resend, Stripe), Adapters, Webhook handlers |
| **Replayable** | **CONDITIONAL** — depends on external system idempotency guarantees |
| **Affects domain state** | **NO** — integration events are outbound. Inbound webhooks create domain events. |
| **Must persist** | **OPTIONAL** — for tracking and debugging. Not required for correctness. |
| **Idempotency** | Required — external systems may retry. Provider message IDs for dedup. |

### Integration Event Catalog

| Event Name | Direction | Provider | Persistence |
|---|---|---|---|
| `whatsapp.message_dispatched` | Outbound | N8N / Wasender | `whatsapp_messages` table |
| `whatsapp.delivery_received` | Inbound (webhook) | WhatsApp | `notification_events` table |
| `email.message_sent` | Outbound | Resend | `email_logs` table |
| `email.delivery_received` | Inbound (webhook) | Resend | `email_logs` table |
| `stripe.webhook_received` | Inbound (webhook) | Stripe | `system_logs` table |
| `stripe.payment_processed` | Inbound (webhook) | Stripe | `subscriptions` table |

### Integration Event Rules

```
1. Integration events MAY trigger domain events (inbound webhooks → domain events)
2. Integration events MUST be idempotent (external systems may retry)
3. Integration events MUST NOT be replayed without idempotency check
4. Integration event failures MUST NOT block domain state
5. Integration events SHOULD have provider-side dedup
```

---

## Category Comparison

| Aspect | Domain Events | Technical Events | Integration Events |
|---|---|---|---|
| **Persistence** | Required (`domain_events` table) | Optional (in-memory) | Optional (per-provider logging) |
| **Replay** | Safe and supported | Pointless (time-sensitive) | Conditional (provider idempotency) |
| **Affects domain state** | Yes (state transitions) | No | No (inbound creates domain event) |
| **Idempotency** | Required (idempotency_key) | Nice-to-have (time-window) | Required (provider message ID) |
| **Retry** | Yes (orchestrator retries) | No (next event replaces) | Yes (circuit breaker for providers) |
| **DLQ** | Yes (permanent + retryable) | No | Yes (permanent provider failures) |
| **Examples** | `payment.confirmed` | `calendar.refresh_requested` | `whatsapp.message_dispatched` |

---

## Event Boundaries

**BOOKING EVENTS** — Only deal with appointment creation and scheduling. Never trigger payroll or notifications directly.

**CONFIRMATION EVENTS** — Deal with client-side attendance confirmation. Never trigger state transitions on their own (orchestrator validates).

**EXECUTION EVENTS** — Deal with service delivery marking. Carry price adjustment data. Never trigger payment processing.

**PAYMENT EVENTS** — Deal with financial settlement. Trigger payroll generation via orchestrator.

**PAYROLL EVENTS** — Deal with payroll computation only. Never deal with appointment state.

**NOTIFICATION EVENTS** — Deal with outbound communication only. Never deal with domain state.

**OVERRIDE EVENTS** — Formalize manual interventions. Always carry `reason` and `manual_override_type`.

**TECHNICAL EVENTS** — Deal with infrastructure coordination. Never carry business data.

**INTEGRATION EVENTS** — Deal with external system boundaries. Never trigger domain transitions directly.

---

## Category Responsibilities

| Category | Who Emits | Who Consumes | State Mutations | Persistence Required |
|---|---|---|---|---|
| **Domain Events** | Actions, Cron detectors | Orchestrator, Listeners | Yes | Yes |
| **Technical Events** | Orchestrator | CacheInvalidationListener, RealtimeListener | No | No |
| **Integration Events** | Listeners, Adapters | External providers, Webhook handlers | No | Optional |

---

## Contamination Rules

```
╔══════════════════════════════════════════════════════════════════╗
║                    CONTAMINATION RULES                           ║
╠══════════════════════════════════════════════════════════════════╣
║ 1. Technical events MUST NOT contain domain business data       ║
║ 2. Integration events MUST NOT trigger domain transitions       ║
║ 3. Domain events MUST NOT depend on technical events           ║
║ 4. Integration event failures MUST NOT cascade to domain state ║
║ 5. Technical events MUST NOT be used for business decisions    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Navigation

- **Previous:** [Orchestrator Architecture](07-orchestrator-architecture.md)
- **Next:** [Replay & Idempotency](09-replay-and-idempotency.md)
- **Index:** [README.md](README.md)
