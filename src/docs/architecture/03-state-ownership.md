# State Ownership

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Domain Invariants](05-domain-invariants.md)  
> **Next:** [Transition Authority](04-transition-authority.md)  
> **Index:** [README.md](README.md)

---

## Single Writer Principle

Only one orchestrator may own write authority over a specific domain state boundary. This is the foundational rule of state ownership in Prügressy.

```
┌────────────────────────────────────────────────────────────────┐
│                SINGLE WRITER PRINCIPLE                         │
│                                                                │
│  Each domain state boundary has EXACTLY ONE owner that may     │
│  mutate it. All other components read the state via queries    │
│  or receive it through events.                                 │
│                                                                │
│  If you need to change state, emit an event to the owner.      │
│  If you are not the owner, you do NOT write.                   │
└────────────────────────────────────────────────────────────────┘
```

Violating the Single Writer Principle causes:
- **Race conditions:** Two components writing the same field simultaneously
- **Inconsistent state:** Partial updates from different writers
- **Lost updates:** Silent overwrites from non-coordinating writers
- **Audit gaps:** Impossible to trace who changed what and why

---

## State Ownership Matrix

| Domain State | Owner | Mutators | Affecting Events | Reacting Listeners | Bounded Context |
|---|---|---|---|---|---|
| **Booking State** | AppointmentOrchestrator | AppointmentOrchestrator only | `appointment.created`, `appointment.rescheduled`, `appointment.cancelled` | AuditListener, NotificationListener, CacheInvalidationListener | Appointment Management |
| **Confirmation State** | AppointmentOrchestrator | AppointmentOrchestrator only | `client.confirmed`, `client.confirmed_manually`, `client.cancelled` | AuditListener, NotificationListener, CacheInvalidationListener | Appointment Management |
| **Execution State** | AppointmentOrchestrator | AppointmentOrchestrator only | `service.completed`, `service.completed_manually`, `service.overdue`, `auto_completion.triggered` | AuditListener, NotificationListener, CacheInvalidationListener, RealtimeListener | Appointment Management |
| **Payment State** | AppointmentOrchestrator | AppointmentOrchestrator only | `payment.confirmed`, `price.adjusted` | AuditListener, PayrollListener, NotificationListener, CacheInvalidationListener | Financial Settlement |
| **Payroll State** | PayrollOrchestrator | PayrollOrchestrator only | `payroll.generation_requested`, `payroll.receipt_requested`, `payroll.period_closed` | AuditListener, NotificationListener | Payroll Management |
| **Notification State** | NotificationListener | NotificationListener only | `notification.requested` | AuditListener (read-only) | Communication |

---

## Ownership Boundaries by State

### Booking State

```
Fields owned: appointments.status (partial: 'pending'|'confirmed'),
              appointments.date, start_time, end_time,
              appointments.employee_id, appointments.client_id,
              appointments.source, appointments.is_walk_in

Owner: AppointmentOrchestrator

Writers: AppointmentOrchestrator (only via transition validation)

Readers: Actions (createAppointment.ts read to validate),
         CalendarView (read),
         SlotEngine (read for availability),
         NotificationListener (read for templates)

Entry events: appointment.created, appointment.rescheduled
Exit events: appointment.created → NOTIFICATION_REQUESTED,
             appointment.rescheduled → NOTIFICATION_REQUESTED,
             appointment.cancelled (transitions to Cancellation state)

Invariants:
- No overlapping appointments for same employee
- Employee availability must exist for the slot
- min_notice_hours respected for public bookings (unless bypassNotice=true)
```

### Confirmation State

```
Fields owned: appointments.confirmation_status (partial: initial states)

Owner: AppointmentOrchestrator

Writers: AppointmentOrchestrator (only via transition validation)

Readers: Actions (markCompleted.ts read for validation),
         ConfirmationPanel (read),
         Cron detectors (read for overdue detection)

Entry events: client.confirmed, client.confirmed_manually, client.cancelled
Exit events: N/A (Confirmation feeds into Execution state)

Invariants:
- Cannot confirm if already confirmed
- Client can only confirm via notification reply
- Manual confirmation requires staff+ role and explicit reason
```

### Execution State

```
Fields owned: appointments.status (partial: 'completed'|'cancelled'|'no_show'),
              appointments.confirmation_status (partial: 'completed'|'needs_review'|'cancelled'),
              appointments.completed_at, appointments.completed_by,
              appointments.price_adjustment

Owner: AppointmentOrchestrator

Writers: AppointmentOrchestrator (only via transition validation)

Readers: Actions, ConfirmationPanel, PayrollListener (read for commission calc),
         Cron detectors (read for auto-complete)

Entry events: service.completed, service.completed_manually,
              service.overdue, auto_completion.triggered

Exit events: service.completed → NOTIFICATION_REQUESTED + CALENDAR_REFRESH_REQUESTED
             service.completed_manually → NOTIFICATION_REQUESTED + CALENDAR_REFRESH_REQUESTED
             service.overdue → NOTIFICATION_REQUESTED
             auto_completion.triggered → NOTIFICATION_REQUESTED + CALENDAR_REFRESH_REQUESTED

Invariants:
- Only assigned employee may mark completed
- Cannot mark completed if already completed or confirmed
- Manual completion requires staff+ role
- System auto-completion only after 120min in needs_review
```

### Payment State

```
Fields owned: appointments.confirmation_status (partial: 'confirmed'),
              appointments.confirmed_at, appointments.confirmed_by,
              appointments.payment_method

Owner: AppointmentOrchestrator

Writers: AppointmentOrchestrator (only via transition validation)

Readers: PayrollListener (read for commission calc),
         FinancialDashboard (read),
         Analytics (read)

Entry events: payment.confirmed, price.adjusted
Exit events: payment.confirmed → PAYROLL_GENERATION_REQUESTED
                                    + NOTIFICATION_REQUESTED
                                    + CALENDAR_REFRESH_REQUESTED
                                    + APPOINTMENT_EXECUTION_COMPLETED

Invariants:
- Payment confirmed requires valid service completion
- Price cannot be adjusted after payment confirmed
- Payment method is required (one of 8 valid methods)
- PAYROLL_GENERATION_REQUESTED must not be emitted if payroll already exists
```

### Payroll State

```
Fields owned: payroll_periods.*, payroll_items.*,
              period_commissions.*, payroll_receipts.*,
              payroll_receipt_services.*, payroll_receipt_loans.*

Owner: PayrollOrchestrator

Writers: PayrollOrchestrator (via PayrollListener)

Readers: PayrollDashboard, EmployeePayrollView,
         Admin reports, NotificationListener (read for receipt email)

Entry events: payroll.generation_requested, payroll.receipt_requested
Exit events: payroll.generated, payroll.failed, receipt_generated

Invariants:
- Same appointment+service cannot generate duplicate commission
- Payroll period must exist before adding items
- Receipt cannot be generated for finalized period
- Net pay must equal gross pay minus deductions
```

### Notification State

```
Fields owned: notification_queue.*, notification_events.*,
              notifications.*, whatasapp_messages.*, email_logs.*

Owner: NotificationListener

Writers: NotificationListener only (via queue processing)

Readers: NotificationDashboard, AuditListener (read-only),
         Admin logs, Inbound processor (read for reply correlation)

Entry events: notification.requested
Exit events: notification.delivery_confirmed, notification.failed

Invariants:
- Notifications must NEVER mutate domain state (appointments, payroll)
- Rate limits must be respected per channel per organization
- Failed notifications move to dead-letter queue after max retries
```

---

## Cross-Boundary Access Rules

### Who Can Read What

| Component | Can Read | Cannot Read |
|---|---|---|
| AppointmentOrchestrator | Booking, Confirmation, Execution, Payment state | Payroll state (no business need) |
| PayrollOrchestrator | Execution state (completed appointments), Payment state | Booking state, Notification state |
| NotificationListener | Booking state (for templates) | Payment state, Payroll state |
| CacheInvalidationListener | Nothing (works solely on event metadata) | Any domain state |
| RealtimeListener | Nothing (works solely on event metadata) | Any domain state |
| AuditListener | Nothing (records events, does not query state) | Any domain state (does not query) |

### Who Can Write What

| Component | Can Write | Cannot Write |
|---|---|---|
| AppointmentOrchestrator | `appointments` table (transition fields), `confirmation_logs` | `payroll_*` tables, `notification_queue` |
| PayrollOrchestrator | `payroll_*` tables | `appointments` table, `notification_queue` |
| NotificationListener | `notification_queue`, `notifications`, `whatsapp_messages`, `email_logs` | `appointments` table, `payroll_*` tables |
| CacheInvalidationListener | Next.js cache ONLY via `revalidateTag`/`revalidatePath` | Any database table |
| RealtimeListener | Supabase Realtime channels ONLY | Any database table |

### Prohibitions

```
╔══════════════════════════════════════════════════════════════════╗
║                     STRICT PROHIBITIONS                          ║
╠══════════════════════════════════════════════════════════════════╣
║ 1. NotificationListener MUST NEVER write to appointments table   ║
║ 2. PayrollListener MUST NEVER write to appointments table        ║
║ 3. CacheInvalidationListener MUST NEVER write to any DB table    ║
║ 4. Cron detectors MUST NEVER write to any DB table              ║
║ 5. Actions MUST NOT write domain state (emit events instead)    ║
║ 6. RealtimeListener MUST NOT write to any DB table              ║
║ 7. AuditListener MUST NOT write to any domain table             ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## State Ownership Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  BOOKING STATE ─────► CONFIRMATION STATE ────► EXECUTION STATE         │
│  Owner: Orchestrator   Owner: Orchestrator      Owner: Orchestrator    │
│                                                       │                │
│                                                       ▼                │
│                                              ┌────────────────┐        │
│                                              │ PAYMENT STATE   │        │
│                                              │ Owner: Orchestr│        │
│                                              └────────┬───────┘        │
│                                                       │                │
│                                                       ▼                │
│                                              ┌────────────────┐        │
│                                              │ PAYROLL STATE   │        │
│                                              │ Owner: Payroll  │        │
│                                              └────────────────┘        │
│                                                                         │
│  NOTIFICATION STATE (cross-cutting, owner: NotificationListener)       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Each arrow represents a CAUSATION chain:
  State A's exit event → State B's entry event
```

---

## Ownership Conflicts and Resolution

| Conflict Scenario | Resolution |
|---|---|
| Two components attempt to write `appointments.status` | AppointmentOrchestrator is single writer; all state changes go through it. Concurrent requests are serialized via `SELECT ... FOR UPDATE`. |
| A listener needs to update appointment state | Listener emits an event. Orchestrator receives, validates, and executes the transition. |
| Payroll needs to mark an appointment as non-commissionable | PayrollListener reads appointment state. If correction needed, emits `price.adjusted` which orchestrator validates. |
| Notification reply (WhatsApp) needs to confirm appointment | Inbound processor emits `client.confirmed`. Orchestrator validates and transitions. NotificationListener never writes directly. |

---

## Navigation

- **Previous:** [Domain Invariants](05-domain-invariants.md)
- **Next:** [Transition Authority](04-transition-authority.md)
- **Index:** [README.md](README.md)
