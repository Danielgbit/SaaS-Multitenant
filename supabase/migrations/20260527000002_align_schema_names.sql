-- =====================================================
-- FIX: Align schema names between migrations and production
-- Fecha: 2026-05-27
-- Descripción:
--   - Renombra promo_code_usages → promo_code_uses
--   - Renombra fixed_salary → base_salary en employees
--   - Renombra default_commission_rate → percentage en employees
--   =====================================================

-- =====================================================
-- 1. Align promo_code_uses table name
-- La migración original creó "promo_code_usages" pero
-- producción tiene "promo_code_uses"
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'promo_code_usages'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'promo_code_uses'
  ) THEN
    ALTER TABLE promo_code_usages RENAME TO promo_code_uses;
  END IF;
END $$;

-- =====================================================
-- 2. Align employees.fixed_salary → base_salary
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'fixed_salary'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'base_salary'
  ) THEN
    ALTER TABLE employees RENAME COLUMN fixed_salary TO base_salary;
  END IF;
END $$;

-- =====================================================
-- 3. Align employees.default_commission_rate → percentage
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'default_commission_rate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'percentage'
  ) THEN
    ALTER TABLE employees RENAME COLUMN default_commission_rate TO percentage;
  END IF;
END $$;
