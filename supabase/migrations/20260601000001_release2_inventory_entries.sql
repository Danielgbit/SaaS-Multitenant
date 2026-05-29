-- ============================================================
-- Release 2 — Inventory Lightweight
-- Migration: 20260601000001
-- 
-- Amplía operation_entries para:
--   1. entry_type: agrega product_sale, inventory_purchase
--   2. direction: endurece CHECK (financieros vs informativos)
--   3. entry_group: columna para agrupación semántica
-- ============================================================

-- 1. entry_group column (opcional, para analytics futuros)
alter table operation_entries add column if not exists entry_group text;

-- 2. Endurecer CHECK de direction
--    Financieros: direction NOT NULL
--    Informativos (inventory_out, note, break): direction NULL
alter table operation_entries drop constraint if exists operation_entries_direction_check;
alter table operation_entries add constraint operation_entries_direction_check
  check (
    (
      entry_type in ('income','product_sale','expense','inventory_purchase','payroll_expense','adjustment')
      and direction is not null
    )
    or (
      entry_type in ('inventory_out','note','break')
      and direction is null
    )
  );

-- 3. Ampliar CHECK de entry_type
alter table operation_entries drop constraint if exists operation_entries_entry_type_check;
alter table operation_entries add constraint operation_entries_entry_type_check
  check (entry_type in (
    'income', 'product_sale', 'expense', 'inventory_purchase',
    'payroll_expense', 'inventory_out', 'adjustment', 'note', 'break'
  ));

-- 4. Ampliar CHECK de created_via (agregar product_sale_hook)
alter table operation_entries drop constraint if exists operation_entries_created_via_check;
alter table operation_entries add constraint operation_entries_created_via_check
  check (created_via in (
    'manual', 'appointment_auto', 'payroll_auto',
    'inventory_auto', 'product_sale_hook', 'migration'
  ));

-- 5. Ampliar CHECK de source_type (agregar inventory_sale)
alter table operation_entries drop constraint if exists operation_entries_source_type_check;
alter table operation_entries add constraint operation_entries_source_type_check
  check (source_type in (
    'appointment', 'payroll', 'inventory', 'inventory_sale', 'manual'
  ));
