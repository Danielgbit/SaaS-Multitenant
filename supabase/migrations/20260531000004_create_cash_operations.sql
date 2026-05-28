-- ============================================================
-- Daily Operations / Cash Session System
-- Migration: 20260531000004
-- ============================================================

create table cash_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  session_date date not null default current_date,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opening_cash numeric(12,2) default 0 not null,
  real_cash_detail jsonb,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  notes text,
  opened_at timestamptz default now(),
  closed_at timestamptz,
  created_at timestamptz default now()
);

-- Index único parcial: 1 sesión abierta por día por organización
create unique index uq_open_session
  on cash_sessions (organization_id, session_date)
  where status = 'open';

create table operation_entries (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references cash_sessions(id) on delete cascade,
  entry_type text not null
    check (entry_type in ('income','expense','payroll_expense','inventory_out','adjustment','note','break')),
  entry_status text not null default 'active'
    check (entry_status in ('active', 'voided')),
  created_via text not null
    check (created_via in ('manual','appointment_auto','payroll_auto','inventory_auto','migration')),
  direction text
    check (
      (entry_type in ('income','expense','payroll_expense','adjustment') and direction is not null)
      or
      (entry_type in ('note','break') and direction is null)
      or
      (entry_type = 'inventory_out' and direction is not null)
    ),
  title text not null,
  description text,
  amount numeric(12,2) default 0 not null,
  payment_method text
    check (payment_method in ('cash', 'qr', 'transfer', 'card')),
  source_type text
    check (source_type in ('appointment', 'payroll', 'inventory', 'manual')),
  source_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id),
  voided_by uuid references auth.users(id),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz default now(),
  constraint uq_operation_source
    unique (cash_session_id, source_type, source_id, direction, entry_type)
);

create index idx_oe_session on operation_entries(cash_session_id, created_at);
create index idx_oe_session_active on operation_entries(cash_session_id, entry_status, created_at);
create index idx_oe_source on operation_entries(source_type, source_id);
create index idx_cs_org_date on cash_sessions(organization_id, session_date desc);

create view cash_session_summary as
select
  cs.id, cs.organization_id, cs.session_date, cs.opening_cash, cs.status,
  cs.opened_by, cs.closed_by, cs.opened_at, cs.closed_at,
  cs.real_cash_detail, cs.notes, cs.created_at,
  (cs.opening_cash + coalesce(sum(oe.amount) filter (
    where oe.direction = 'in' and oe.entry_status = 'active'
  ), 0) - coalesce(sum(oe.amount) filter (
    where oe.direction = 'out' and oe.entry_status = 'active'
  ), 0)) as expected_cash,
  jsonb_build_object(
    'cash', coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'cash' and oe.direction = 'in' and oe.entry_status = 'active'
    ), 0) - coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'cash' and oe.direction = 'out' and oe.entry_status = 'active'
    ), 0),
    'qr', coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'qr' and oe.direction = 'in' and oe.entry_status = 'active'
    ), 0) - coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'qr' and oe.direction = 'out' and oe.entry_status = 'active'
    ), 0),
    'transfer', coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'transfer' and oe.direction = 'in' and oe.entry_status = 'active'
    ), 0) - coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'transfer' and oe.direction = 'out' and oe.entry_status = 'active'
    ), 0),
    'card', coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'card' and oe.direction = 'in' and oe.entry_status = 'active'
    ), 0) - coalesce(sum(oe.amount) filter (
      where oe.payment_method = 'card' and oe.direction = 'out' and oe.entry_status = 'active'
    ), 0)
  ) as expected_cash_detail,
  count(oe.id) filter (where oe.entry_status = 'active') as active_entries_count,
  count(oe.id) filter (where oe.direction = 'in' and oe.entry_status = 'active') as income_count,
  count(oe.id) filter (where oe.direction = 'out' and oe.entry_status = 'active') as expense_count
from cash_sessions cs
left join operation_entries oe on oe.cash_session_id = cs.id
group by cs.id;
