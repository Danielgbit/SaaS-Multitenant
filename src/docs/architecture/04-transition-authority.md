# Transition Authority

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [State Ownership](03-state-ownership.md)  
> **Next:** [Domain Invariants](05-domain-invariants.md)  
> **Index:** [README.md](README.md)

---

## Core Rule

Every state transition in Prügressy has a strictly defined set of actors who may trigger it. No actor may trigger a transition they are not authorized for, regardless of whether the state machine allows it.

```
┌────────────────────────────────────────────────────────────────┐
│                TRANSITION AUTHORITY PRINCIPLE                   │
│                                                                │
│  A state transition is valid ONLY if:                          │
│    1. The state machine allows it (current → target)           │
│    2. The actor is authorized for this transition               │
│    3. All invariants pass (see Domain Invariants)              │
│    4. Override is explicitly allowed (if applicable)            │
│                                                                │
│  If any condition fails → transition is REJECTED.              │
└────────────────────────────────────────────────────────────────┘
```

---

## Actor Definitions

| Actor | System Identifier | Description |
|---|---|---|
| **Client** | `actor_role: "client"` | End customer. No login. Identified by phone/email. |
| **Employee** | `actor_role: "employee"` | Service provider. Has login. Limited to own appointments. |
| **Staff** | `actor_role: "staff"` | Receptionist. Has login. Manages appointments and payments. |
| **Admin** | `actor_role: "admin"` | Business administrator. Has login. Full operational access. |
| **Owner** | `actor_role: "owner"` | Business owner. Has login. Maximum privilege. |
| **System** | `actor_role: "system"` | Automated processes. Cron detectors, orchestrators, listeners. |
| **Provider** | `actor_role: "provider"` | External services (WhatsApp, email, Stripe webhooks). |

---

## Transition Authority Matrix

### APPOINTMENT_CREATED

| Property | Value |
|---|---|
| **Event** | `appointment.created` |
| **From state** | — (initial) |
| **To state** | `(pending, scheduled)` |
| **Allowed actors** | Client (public booking), Staff, Admin, Owner |
| **Required role** | Client: none (public). Staff+ for internal. |
| **Override allowed** | Yes (staff creates on behalf of client) |
| **Audit required** | Yes. `confirmation_logs` action: `created` |
| **Operational constraints** | Internal: bypassNotice=true. Public: respects min_notice_hours. Client must provide contact info. |

### APPOINTMENT_RESCHEDULED

| Property | Value |
|---|---|
| **Event** | `appointment.rescheduled` |
| **From state** | `(pending, scheduled)` |
| **To state** | `(pending, scheduled)` (same state, new time) |
| **Allowed actors** | Staff, Admin, Owner |
| **Required role** | Staff+ |
| **Override allowed** | No |
| **Audit required** | Yes. Log in `confirmation_logs` with action: `rescheduled` |
| **Operational constraints** | New slot must be available. No overlapping appointments. Cannot reschedule after service completed. |

### CLIENT_CONFIRMED

| Property | Value |
|---|---|
| **Event** | `client.confirmed` |
| **From state** | `(pending, scheduled)` |
| **To state** | `(confirmed, scheduled)` |
| **Allowed actors** | **System only** (Inbound notification processor) |
| **Required role** | System |
| **Override allowed** | Yes (use CLIENT_CONFIRMED_MANUALLY instead) |
| **Audit required** | Yes. Logged automatically via event emission. |
| **Operational constraints** | Only triggered by WhatsApp/email reply parsing. Client identity verified by phone number match. |

### CLIENT_CONFIRMED_MANUALLY

| Property | Value |
|---|---|
| **Event** | `client.confirmed_manually` |
| **From state** | `(pending, scheduled)` |
| **To state** | `(completed, completed)` |
| **Allowed actors** | Staff, Admin, Owner |
| **Required role** | Staff+ |
| **Override allowed** | **Yes — this is an override by design** |
| **Audit required** | **MANDATORY.** `reason` field is REQUIRED in payload. |
| **Operational constraints** | Must include `manual_confirmation_type: "walk_in" | "override" | "reception"`. Must include `reason`. Skips employee marking step. |

### SERVICE_COMPLETED

| Property | Value |
|---|---|
| **Event** | `service.completed` |
| **From state** | `(pending, scheduled)` |
| **To state** | `(completed, completed)` |
| **Allowed actors** | Employee (**own appointments only**) |
| **Required role** | Employee |
| **Override allowed** | No (use SERVICE_COMPLETED_MANUALLY) |
| **Audit required** | Yes. `confirmation_logs` action: `created`, performed_by_role: `employee` |
| **Operational constraints** | Employee must be the assigned employee for the appointment (`employee.id === appointment.employee_id`). Price adjustment may be applied. |

### SERVICE_COMPLETED_MANUALLY

| Property | Value |
|---|---|
| **Event** | `service.completed_manually` |
| **From state** | `(pending, scheduled)` or `(completed, needs_review)` |
| **To state** | `(completed, completed)` |
| **Allowed actors** | Staff, Admin, Owner |
| **Required role** | Staff+ |
| **Override allowed** | **Yes — this is an override by design** |
| **Audit required** | **MANDATORY.** `reason` field is REQUIRED in payload. |
| **Operational constraints** | Must include `manual_completion_type: "override" | "reception"`. Must include `reason`. Used when employee is unavailable, walk-in without employee, or correction. |

### SERVICE_OVERDUE

| Property | Value |
|---|---|
| **Event** | `service.overdue` |
| **From state** | `(pending, scheduled)` |
| **To state** | `(completed, needs_review)` |
| **Allowed actors** | **System only** (Cron detector) |
| **Required role** | System |
| **Override allowed** | No (this is a system boundary) |
| **Audit required** | Yes. Event automatically logged. |
| **Operational constraints** | Only emitted when `end_time + 60min <= NOW()`. Dedup prevents re-emission for same window. Never emitted if employee already marked completed. |

### AUTO_COMPLETION_TRIGGERED

| Property | Value |
|---|---|
| **Event** | `auto_completion.triggered` |
| **From state** | `(completed, needs_review)` |
| **To state** | `(completed, completed)` |
| **Allowed actors** | **System only** (Cron detector) |
| **Required role** | System |
| **Override allowed** | No (this is a system boundary) |
| **Audit required** | Yes. `confirmation_logs` action: `manually_set`, performed_by_role: `system`, notes: 'Auto-completado por el sistema después de 120 min' |
| **Operational constraints** | Only emitted when `end_time + 120min <= NOW()` AND `confirmation_status = 'needs_review'`. Never emitted if payment already confirmed. |

### PAYMENT_CONFIRMED

| Property | Value |
|---|---|
| **Event** | `payment.confirmed` |
| **From state** | `(completed, completed)` or `(completed, needs_review)` |
| **To state** | `(completed, confirmed)` |
| **Allowed actors** | Staff, Admin, Owner |
| **Required role** | Staff+ |
| **Override allowed** | No (payment is a financial operation) |
| **Audit required** | **MANDATORY.** `confirmation_logs` action: `confirmed`, performed_by_role: `assistant`. Price before/after recorded. |
| **Operational constraints** | `payment_method` is REQUIRED (one of 8 valid values). Cannot confirm if already confirmed. Price must have been calculated (base + adjustments). |

### PRICE_ADJUSTED

| Property | Value |
|---|---|
| **Event** | `price.adjusted` |
| **From state** | `(pending, scheduled)` or `(completed, completed)` |
| **To state** | Same state (price is metadata, not state) |
| **Allowed actors** | Staff, Admin, Owner |
| **Required role** | Staff+ |
| **Override allowed** | Yes (correction) |
| **Audit required** | **MANDATORY.** `confirmation_logs` action: `adjusted`. Price before/after recorded. `reason` REQUIRED. |
| **Operational constraints** | Cannot adjust after `payment.confirmed` (invariant INV-009). If payroll already exists, compensating payroll event must follow. |

### APPOINTMENT_CANCELLED

| Property | Value |
|---|---|
| **Event** | `appointment.cancelled` |
| **From state** | Any non-terminal state |
| **To state** | `(cancelled, cancelled)` |
| **Allowed actors** | Client, Staff, Admin, Owner |
| **Required role** | Client: only before service completion. Staff+: always. |
| **Override allowed** | Yes (staff can cancel even after service if needed) |
| **Audit required** | **MANDATORY.** `confirmation_logs` action: `cancelled`. `reason` REQUIRED for staff+ cancellations. |
| **Operational constraints** | Client can only cancel if `confirmation_status != 'confirmed'` and within allowed time window. Staff+ can cancel any non-terminal appointment. |

### NO_SHOW_MARKED

| Property | Value |
|---|---|
| **Event** | `appointment.no_show` |
| **From state** | `(pending, scheduled)` or `(confirmed, scheduled)` |
| **To state** | `(no_show, cancelled)` |
| **Allowed actors** | Staff, Admin, Owner |
| **Required role** | Staff+ |
| **Override allowed** | Yes |
| **Audit required** | **MANDATORY.** `reason` REQUIRED. |
| **Operational constraints** | Cannot mark no_show if payment was already confirmed (invariant INV-005). Cannot mark no_show if service was already completed. |

---

## Override Permissions by Role

| Override Type | Employee | Staff | Admin | Owner | System |
|---|---|---|---|---|---|
| Manual service completion | ❌ | ✅ | ✅ | ✅ | ❌ |
| Manual client confirmation | ❌ | ✅ | ✅ | ✅ | ❌ |
| Price adjustment | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cancellation (after service) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cancellation (before service) | ❌ | ✅ | ✅ | ✅ | ✅ (client) |
| No-show marking | ❌ | ✅ | ✅ | ✅ | ❌ |
| Appointment reschedule | ❌ | ✅ | ✅ | ✅ | ❌ |

**Legend:**
- ✅ = Allowed. Override flag `true` in event metadata. Reason MANDATORY.
- ❌ = Not allowed. Must use different event type or role escalation.

---

## Audit Requirements by Transition

| Transition | `confirmation_logs` Action | Required Fields |
|---|---|---|
| `appointment.created` | `created` | `price_before`, `price_after` |
| `appointment.rescheduled` | `rescheduled` | `notes` (new time) |
| `appointment.cancelled` | `cancelled` | `notes` (reason) |
| `service.completed` | `created` | `price_before`, `price_after`, `performed_by_role: 'employee'` |
| `service.completed_manually` | `manually_set` | `notes` (reason), `performed_by_role: 'assistant'` |
| `service.overdue` | — (logged via event) | System event |
| `auto_completion.triggered` | `manually_set` | `performed_by_role: 'system'`, `notes: 'Auto-completado'` |
| `payment.confirmed` | `confirmed` | `price_before`, `price_after`, `payment_method` |
| `price.adjusted` | `adjusted` | `price_before`, `price_after`, `notes` (reason) |
| `no_show` | `cancelled` | `notes` (reason) |
| `client.confirmed` | `confirmed_by_client` | System event |
| `client.confirmed_manually` | `manually_set` | `notes` (reason), `performed_by_role: 'assistant'` |

---

## Transition Authority Diagram

```
                          APPOINTMENT_CREATED
                          Actors: Client, Staff, Admin, Owner
                               │
                               ▼
                    ┌───────────────────┐
                    │  (pending,        │
                    │   scheduled)      │
                    └───────────────────┘
                     │              │
          CLIENT     │              │  SERVICE_COMPLETED
          CONFIRMED  │              │  Actor: Employee ONLY
          Actor:     │              │
          System     │              ▼
          ONLY       │    ┌───────────────────┐
                     │    │  (completed,      │
                     │    │   completed)      │
                     │    └───────────────────┘
                     │     │              │
          CLIENT     │     │  PAYMENT     │  SERVICE_OVERDUE
          CONFIRMED │     │  CONFIRMED   │  Actor: System ONLY
          MANUALLY  │     │  Actor:      │
          Actor:    │     │  Staff+      ▼
          Staff+    │     │    ┌───────────────────┐
                     │     │    │  (completed,      │
                     │     │    │   needs_review)   │
                     │     │    └───────────────────┘
                     │     │     │              │
                     ▼     ▼     ▼              ▼
               ┌──────────────────────────────────────┐
               │         (cancelled, cancelled)        │
               │         (terminal)                     │
               └──────────────────────────────────────┘
               Actors: Client (before service),
                       Staff+ (anytime)

          PAYMENT_CONFIRMED
          Actor: Staff+
               ▼
          ┌───────────────────┐
          │  (completed,      │
          │   confirmed)      │
          │   TERMINAL        │
          └───────────────────┘
```

---

## Transition Rejection Responses

| Rejection Reason | HTTP Equivalent | Recovery |
|---|---|---|
| `actor_not_authorized` | 403 | User must use different action or role escalation |
| `invalid_transition` | 409 | State machine does not allow this transition |
| `invariant_violation` | 422 | Business rule prevents this transition |
| `duplicate_event` | 200 (idempotent) | Event already processed, no action needed |
| `concurrent_write` | 409 (retry) | Another transition in progress, retry |
| `missing_override_reason` | 422 | Reason field is required for overrides |

---

## Navigation

- **Previous:** [State Ownership](03-state-ownership.md)
- **Next:** [Domain Invariants](05-domain-invariants.md)
- **Index:** [README.md](README.md)
