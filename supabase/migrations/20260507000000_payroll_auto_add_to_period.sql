-- =====================================================
-- PAYROLL AUTO-ADD: Conectar confirmación de pago → nómina
-- Fecha: 2026-05-07
-- Descripción: Prepara period_commissions para auto-guardado
--   al confirmar pago. Agrega service_id, appointment_service_id,
--   notes y nuevo UNIQUE constraint para per-service entries.
-- =====================================================

-- 1. Agregar columnas para trazabilidad granular
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'period_commissions' AND column_name = 'appointment_service_id') THEN
        ALTER TABLE period_commissions ADD COLUMN appointment_service_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'period_commissions' AND column_name = 'service_id') THEN
        ALTER TABLE period_commissions ADD COLUMN service_id UUID REFERENCES services(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'period_commissions' AND column_name = 'notes') THEN
        ALTER TABLE period_commissions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 2. Reemplazar UNIQUE constraint para soportar múltiples servicios por cita
ALTER TABLE period_commissions
  DROP CONSTRAINT IF EXISTS period_commissions_payroll_item_id_appointment_id_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'period_commissions_unique_service'
          AND conrelid = 'period_commissions'::regclass
    ) THEN
        ALTER TABLE period_commissions
          ADD CONSTRAINT period_commissions_unique_service
          UNIQUE (payroll_item_id, appointment_id, service_id);
    END IF;
END $$;

-- 3. FK indexes (Postgres no auto-indexa foreign keys)
CREATE INDEX IF NOT EXISTS idx_period_commissions_appointment ON period_commissions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_period_commissions_service_id ON period_commissions(service_id);
