-- =====================================================
-- NORMALIZAR payment_type en employees
-- Fecha: 2026-05-08
-- Descripción: 
--   1. Eliminar CHECK constraint legacy
--   2. Convertir valores legacy → nuevo formato
--   3. Agregar nuevo CHECK constraint
-- =====================================================

DO $$
BEGIN
  -- 1. Eliminar constraint legacy si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employees_payment_type_check'
      AND conrelid = 'employees'::regclass
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_payment_type_check;
  END IF;

  -- 2. Convertir valores legacy a nuevo formato
  UPDATE employees SET payment_type = 'porcentaje' WHERE payment_type = 'commission';
  UPDATE employees SET payment_type = 'fijo' WHERE payment_type = 'salary';

  -- 3. Agregar nuevo constraint (solo si no existe ya)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employees_payment_type_check'
      AND conrelid = 'employees'::regclass
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_payment_type_check
      CHECK (payment_type = ANY (ARRAY['fijo'::text, 'porcentaje'::text, 'mixed'::text]));
  END IF;
END $$;
