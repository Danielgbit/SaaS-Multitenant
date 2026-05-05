-- =====================================================
-- Agregar columnas de pago a payroll_receipts
-- Fecha: 2026-05-06
-- Descripción: Añade payment_method, payment_reference y paid_at
--              para soportar métodos de pago colombianos
-- =====================================================

-- Agregar payment_method si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_receipts' AND column_name = 'payment_method') THEN
        ALTER TABLE payroll_receipts ADD COLUMN payment_method VARCHAR(20);
    END IF;
END $$;

-- Agregar payment_reference si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_receipts' AND column_name = 'payment_reference') THEN
        ALTER TABLE payroll_receipts ADD COLUMN payment_reference VARCHAR(100);
    END IF;
END $$;

-- Agregar paid_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_receipts' AND column_name = 'paid_at') THEN
        ALTER TABLE payroll_receipts ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;
END $$;
