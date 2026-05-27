# product-mode

## Product Principles

- Financial state is independent from appointment state
- Every financial mutation must be auditable
- Automation must be idempotent
- Analytics are derived, never source-of-truth
- Retention workflows must be observable
- No feature may bypass the event layer

## Event Taxonomy

### Operational Events (no financieros)
- `appointment_confirmed`
- `appointment_cancelled`
- `appointment_completed`

### Financial Events (mutan estado financiero)
- `payment_received` → amount positivo
- `refund_processed` → amount negativo
- `commission_settled` → amount negativo
- `adjustment_applied` → amount positivo o negativo

### Derived States (nunca source of truth)
- `appointments.payment_status` → materializado desde `financial_events`
- `client_accounts.balance` → materializado desde `financial_events`
- dashboard metrics → siempre desde eventos

## Operational Rules

- `financial_events` is append-only
- Derived states are never canonical
- Retries must be idempotent
- All financial mutations must emit events
- Operational workflows and financial workflows evolve independently
- No feature may bypass the event layer

## Compatible Future Extensions

No para construir ahora. Solo para informar coherencia futura.

- Memberships
- Packages / bundles
- Wallet credits
- Subscription billing
- Deferred payments
- Marketplace payouts
- Revenue analytics
- Automated retention workflows

---

## Phase 1 — Revenue Foundation

### Sprint 1 — Events + Ledger (~3-4 days)

**Migration: `financial_events` table**

```sql
CREATE TABLE financial_events (
  id UUID PK DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Taxonomía
  event_type VARCHAR NOT NULL,

  -- Trazabilidad técnica
  source_table VARCHAR NOT NULL,
  source_id UUID NOT NULL,

  -- Trazabilidad de negocio
  entity_type VARCHAR NOT NULL, -- appointment | client | payroll | invoice
  entity_id UUID NOT NULL,

  -- Quién originó
  occurred_by_type VARCHAR, -- user | worker | system
  occurred_by_id UUID,

  -- Monetario (signo: payments=+, refunds=-, commissions=-, adjustments=±)
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR DEFAULT 'COP',

  -- Idempotencia
  idempotency_key TEXT,

  -- Estado (append-only, solo new event + status=reversed)
  status VARCHAR DEFAULT 'pending', -- pending | settled | reversed

  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_financial_events_idempotency
ON financial_events(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_financial_events_org_occurred
ON financial_events(organization_id, occurred_at DESC);

CREATE INDEX idx_financial_events_entity
ON financial_events(entity_type, entity_id);

CREATE INDEX idx_financial_events_type
ON financial_events(event_type, occurred_at DESC);

CREATE INDEX idx_financial_events_status
ON financial_events(status);

CREATE INDEX idx_financial_events_metadata
ON financial_events USING GIN(metadata);
```

**Archivos:**
| Archivo | Tipo |
|---------|------|
| `supabase/migrations/20260528000001_financial_events.sql` | Crear |
| `supabase/migrations/20260528000002_seed_financial_events.sql` | Crear |
| `supabase/migrations/20260528000003_financial_events_triggers.sql` | Crear |
| `src/types/financial.ts` | Crear |

### Sprint 2 — Payment Workflow at Appointment Level (~3-4 days)

- Add `payment_status` to `appointments` (derived, never canonical)
- Trigger to materialize from `financial_events`
- `getAppointmentFinancialStatus` server action
- `AppointmentFinancialTimeline` component in appointment detail modal

**Archivos:**
| Archivo | Tipo |
|---------|------|
| `supabase/migrations/20260529000001_appointment_payment_status.sql` | Crear |
| `supabase/migrations/20260529000002_appointment_payment_status_triggers.sql` | Crear |
| `src/actions/financial/getAppointmentFinancialStatus.ts` | Crear |
| `src/components/calendar/AppointmentFinancialTimeline.tsx` | Crear |
| `src/components/calendar/AppointmentDetailModal.tsx` | Modificar |

### Sprint 3 — AR + Appointments (~2-3 days)

- Link `client_account_transactions` with `appointment_id`
- Auto-create transactions on service confirmation
- `recordAppointmentPayment` server action

**Archivos:**
| Archivo | Tipo |
|---------|------|
| `supabase/migrations/20260530000001_link_transactions_to_appointments.sql` | Crear |
| `src/actions/financial/recordAppointmentPayment.ts` | Crear |
| `src/actions/confirmations/confirmByReception.ts` | Modificar |
| `src/actions/confirmations/markManually.ts` | Modificar |

### Sprint 4 — Commission Hooks (~2-3 days)

- Emit `commission_settled` event on service confirmation
- Show commission info in appointment detail modal

**Archivos:**
| Archivo | Tipo |
|---------|------|
| `src/actions/confirmations/confirmService.ts` | Modificar |
| `src/components/calendar/AppointmentDetailModal.tsx` | Modificar |

### Definition of Done — Phase 1

- [ ] `financial_events` table created + migrated with historical data
- [ ] `financial_events` auto-updated via triggers
- [ ] `FinancialEvent` type exported
- [ ] `appointments.payment_status` added and derived from events
- [ ] `getAppointmentFinancialStatus` server action working
- [ ] `AppointmentFinancialTimeline` component visible in appointment modal
- [ ] `client_account_transactions.appointment_id` added
- [ ] Confirmation flow auto-creates financial transactions
- [ ] `recordAppointmentPayment` server action working
- [ ] Commissions visible in appointment detail
- [ ] Build green
- [ ] TS 0 errors

---

## Phase 2 — Payments + Commissions (placeholder)

- Payment workflow from confirmation
- Automatic commission settlement
- Income dashboard per professional
- Payout tracking

## Phase 3 — Retention Intelligence (placeholder)

Leveraging existing workers + observability:
- Adaptive confirmations
- No-show prevention with auto follow-up
- Rebooking nudges post-cancellation
- Inactive client recovery campaigns

## Phase 4 — Analytics (placeholder)

Only after consistent financial data:
- Revenue trends by professional/service
- Retention cohorts
- Early LTV
- Utilization vs capacity

---

## Not Yet (scope protection)

- Full accounting system
- Multi-currency support
- Tax engine
- Marketplace payouts
- Complex RBAC redesign
- Public API platform
- Workflow builder UI
