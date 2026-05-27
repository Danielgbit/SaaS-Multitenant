-- =====================================================
-- APPOINTMENT PAYMENT STATUS
-- Fecha: 2026-05-29
-- Descripción:
--   payment_status es un campo DERIVADO, nunca canónico.
--   La verdad canónica vive en financial_events.
--   Este campo se materializa automáticamente via trigger.
-- =====================================================

ALTER TABLE appointments
ADD COLUMN payment_status VARCHAR DEFAULT 'unpaid'
CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'credited'));

COMMENT ON COLUMN appointments.payment_status IS
    'Derived from financial_events. Never canonical. Values: unpaid, partial, paid, refunded, credited.';
