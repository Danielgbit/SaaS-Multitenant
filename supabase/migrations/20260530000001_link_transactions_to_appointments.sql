-- =====================================================
-- LINK TRANSACTIONS TO APPOINTMENTS
-- Fecha: 2026-05-30
-- Descripción:
--   Vincula client_account_transactions con appointments
--   para poder trazar pagos desde la cita.
-- =====================================================

ALTER TABLE client_account_transactions
ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_account_transactions_appointment
    ON client_account_transactions(appointment_id);

COMMENT ON COLUMN client_account_transactions.appointment_id IS
    'Vínculo opcional a la cita que originó la transacción';
