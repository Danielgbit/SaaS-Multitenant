# Daily Operations / Cash Session System — Deploy Plan

## Status: READY FOR DEPLOY

---

## 1. Deliverables

### New (19 files)

```
supabase/migrations/20260531000004_create_cash_operations.sql
src/types/cash-sessions.ts
src/lib/utils/colombia-dates.ts
src/actions/cash-sessions/createEntryFromSource.ts
src/actions/cash-sessions/openSession.ts
src/actions/cash-sessions/closeSession.ts
src/actions/cash-sessions/getTodaySession.ts
src/actions/cash-sessions/getSessionHistory.ts
src/actions/operation-entries/createManualEntry.ts
src/actions/operation-entries/voidEntry.ts
src/actions/operation-entries/payEmployee.ts
src/app/(dashboard)/caja/page.tsx
src/app/(dashboard)/caja/loading.tsx
src/components/dashboard/cash-session/CashSessionClient.tsx
src/components/dashboard/cash-session/CashTimeline.tsx
src/components/dashboard/cash-session/CashSummary.tsx
src/components/dashboard/cash-session/OpenSessionForm.tsx
src/components/dashboard/cash-session/NewEntryModal.tsx
src/components/dashboard/cash-session/PayEmployeeModal.tsx
```

### Modified (3 files)

```
src/lib/navigation.ts              ← route /caja added in Operaciones (hideForEmpleado)
src/actions/confirmations/confirmService.ts    ← fire-and-forget hook
src/actions/confirmations/confirmByReception.ts ← fire-and-forget hook
```

### Not modified (no impact)

```
payroll/*       appointments/*   clients/*       employees/*
services/*      financial/*      confirmation_logs/*
```

### Database (applied to Supabase)

```
Tables:   cash_sessions, operation_entries
Indexes:  uq_open_session (partial unique), idx_oe_session,
          idx_oe_session_active, idx_oe_source, idx_cs_org_date
View:     cash_session_summary (expected_cash derived via SUM)
```

---

## 2. Architecture Decisions (locked)

| Decision | Rationale |
|---|---|
| **operation_entries as append-only ledger** | All movements recorded immutably. No updates, only void. |
| **expected_cash derived via view** | No mutable balance to drift. Rebuildable from source. |
| **Fire-and-forget hooks** | Zero risk to existing flows. Silent if module unavailable. |
| **No auto-create session** | Forces intentional opening. Avoids ghost sessions. |
| **Unique constraint idempotency** | `uq_operation_source` prevents double-entry from retries. |
| **Soft delete via `voided` status** | Financial integrity: entries never disappear. |
| **`created_via` column** | Auditability: distinguish manual vs automatic entries. |
| **Timezone helper (`colombia-dates.ts`)** | Single source of truth for operational date. Prevents UTC drift. |
| **Polling 30s (no realtime)** | Sufficient for daily operations. Avoids WebSocket complexity. |
| **No payroll auto-payout** | Payroll period status ≠ actual cash movement. Manual pay only. |

---

## 3. Pre-Deploy Checklist

### 3.1 Database (✅ Done)

```
Migration applied:     ✅ 20260531000004_create_cash_operations.sql
Tables created:        ✅ cash_sessions, operation_entries
Partial unique index:  ✅ uq_open_session (WHERE status = 'open')
View created:          ✅ cash_session_summary (uses count(oe.id) not count(*))
Rollback SQL:          ✅ defined (see section 7)
```

### 3.2 TypeScript Build (✅ Done)

```
npm run build  →  Compiled successfully in 16.9s
TypeScript:    ✅ 0 errors
Routes:        ✅ 60+ routes including /caja
```

### 3.3 Environment (to verify at deploy time)

```bash
# No new env vars needed. Feature is self-contained.
# Verify existing:
echo NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 4. Deploy Steps

```bash
# Step 1: Commit
git add .
git commit -m "feat: daily operations / cash session system"

# Step 2: Push (triggers CI deploy)
git push origin main

# Step 3: Wait for deploy (Vercel/Railway/etc)
# Monitor: CI pipeline, build logs
```

---

## 5. Smoke Test (immediately after deploy)

Execute these 5 scenarios in order. If all pass, release is green.

### 5.1 Open session

```
1. Navigate to /caja as owner/admin
2. See "Abrir Caja del Dia" form
3. Enter $80,000 → Click "Abrir Caja"
4. Verify: timeline empty, summary shows opening
5. Verify DB: cash_sessions has 1 row (status='open')
```

### 5.2 Manual expense

```
1. Click "+ Gasto / Nota"
2. Type: Gasto, Title: "Bases manicure", Amount: $30,000, Method: Efectivo
3. Click "Registrar"
4. Verify: timeline shows "- $30,000 Bases manicure"
5. Verify: summary expected = $50,000
```

### 5.3 Automatic income (confirmService)

```
1. Create appointment in /calendar for today
2. Employee marks completed
3. Admin confirms payment: $20,000, Efectivo
4. Navigate to /caja
5. Verify: timeline shows "+ $20,000 Pago servicio · automático"
6. Verify: summary expected = $70,000
7. Verify DB: operation_entries has 1 row with created_via='appointment_auto'
```

### 5.4 Void entry

```
1. Click X icon on "Bases manicure" entry
2. Enter reason: "Me equivoqué"
3. Verify: entry shows "Anulado", opacity reduced, line-through
4. Verify: summary expected returns to $100,000 ($70,000 + $30,000 reversed)
```

### 5.5 Close session with diff

```
1. Click "Cerrar Caja"
2. Verify form shows 4 payment fields pre-filled
3. Enter same values → verify diff = 0, "Cuadra" in green
4. Click "Confirmar Cierre"
5. Verify: status changes to "Cerrada"
6. Verify DB: cash_sessions.status = 'closed', real_cash_detail populated
```

---

## 6. Monitoring (first 24h)

### Logs to watch

```json
// Expected — appears when confirmService runs without open session:
{"level":"warn","message":"[cash] No hay caja abierta hoy — entry omitido"}

// Unexpected — indicates a bug:
{"level":"error","message":"[cash] Error al crear entry desde fuente"}
{"level":"error","message":"[confirmService] cash entry error"}
```

### Critical business check

```sql
-- Run 24h after deploy:
SELECT status, count(*), sum(opening_cash) FROM cash_sessions
WHERE session_date = current_date GROUP BY status;

SELECT entry_type, count(*), sum(amount) FROM operation_entries
WHERE cash_session_id IN (SELECT id FROM cash_sessions WHERE session_date = current_date)
AND entry_status = 'active'
GROUP BY entry_type;
```

### Success criteria

| Metric | Target |
|---|---|
| Sessions opened | ≥1 per business day |
| Sessions closed | ≥80% opened (not left open) |
| Diff = 0 at close | ≥70% of closings |
| Manual expenses registered | > 0 per day (indicates adoption) |
| `[cash]` warnings | Present but without uncaught errors |

---

## 7. Rollback Plan

### 7.1 Code rollback

```bash
git revert HEAD --no-edit
git push origin main
```

### 7.2 Database rollback

```sql
-- Execute in Supabase SQL Editor:
drop view if exists cash_session_summary;
drop index if exists uq_open_session;
drop index if exists idx_oe_session;
drop index if exists idx_oe_session_active;
drop index if exists idx_oe_source;
drop index if exists idx_cs_org_date;
drop table if exists operation_entries cascade;
drop table if exists cash_sessions cascade;
```

### 7.3 Verification after rollback

```
1. /caja → 404 (route removed)
2. /calendar → works, appointments can be confirmed
3. confirmService → completes without errors
4. DB → cash_sessions / operation_entries tables gone
```

---

## 8. Post-Deploy Roadmap

### Phase 1 — Validation (days 1-7)

| Setting | Value |
|---|---|
| Access | Owner/admin only |
| Staff access | Disabled |
| New features | Frozen |
| Focus | Adopt daily cash routine |

### Phase 2 — Expansion (days 8-14)

- Enable for staff role
- Collect feedback on UX gaps
- Consider adding: `CloseSessionForm` with diff-in-live, carry-over opening

### Phase 3 — Hardening (days 15+)

- Materialized view for cash_session_summary if performance needed
- Export / print report
- Inventory lightweight integration

---

## 9. Key Contacts & Commands

```bash
# Build
npm run build

# Migration status
npx supabase migration list

# Apply pending migrations
npx supabase db push --linked

# Direct DB query
npx supabase db query --linked "SELECT * FROM cash_session_summary WHERE status='open'"

# Check logs
grep "\[cash\]" .next/server/**/*.js 2>/dev/null || echo "check application logs"
```
