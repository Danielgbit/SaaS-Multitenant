-- ============================================================
-- Sprint 0B — Fix CHECK constraints for payment entries
-- Migration: 20260603000000
-- 
-- Corrige las CHECK constraints de operation_entries para
-- permitir los valores que usa recordPayment:
--   - entry_type: 'account_payment'
--   - created_via: 'record_payment'
--   - source_type: 'client_account_payment'
-- ============================================================

-- 1. entry_type: agregar 'account_payment'
ALTER TABLE operation_entries DROP CONSTRAINT IF EXISTS operation_entries_entry_type_check;
ALTER TABLE operation_entries ADD CONSTRAINT operation_entries_entry_type_check
  CHECK (entry_type IN (
    'income', 'product_sale', 'expense', 'inventory_purchase',
    'payroll_expense', 'inventory_out', 'adjustment', 'note', 'break',
    'account_payment'
  ));

-- 2. created_via: agregar 'record_payment'
ALTER TABLE operation_entries DROP CONSTRAINT IF EXISTS operation_entries_created_via_check;
ALTER TABLE operation_entries ADD CONSTRAINT operation_entries_created_via_check
  CHECK (created_via IN (
    'manual', 'appointment_auto', 'payroll_auto',
    'inventory_auto', 'product_sale_hook', 'record_payment', 'migration'
  ));

-- 3. source_type: agregar 'client_account_payment'
ALTER TABLE operation_entries DROP CONSTRAINT IF EXISTS operation_entries_source_type_check;
ALTER TABLE operation_entries ADD CONSTRAINT operation_entries_source_type_check
  CHECK (source_type IN (
    'appointment', 'payroll', 'inventory', 'inventory_sale',
    'client_account_payment', 'manual'
  ));

-- 4. direction: 'account_payment' requiere direction NOT NULL
--    (se inserta con direction = 'in')
ALTER TABLE operation_entries DROP CONSTRAINT IF EXISTS operation_entries_direction_check;
ALTER TABLE operation_entries ADD CONSTRAINT operation_entries_direction_check
  CHECK (
    (
      entry_type IN ('income','product_sale','expense','inventory_purchase',
        'payroll_expense','adjustment','account_payment')
      AND direction IS NOT NULL
    )
    OR (
      entry_type IN ('inventory_out','note','break')
      AND direction IS NULL
    )
  );
