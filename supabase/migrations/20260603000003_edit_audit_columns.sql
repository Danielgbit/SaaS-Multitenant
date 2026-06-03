-- ============================================================
-- Sprint 3 -- Columnas de auditoria de edicion
-- Migration: 20260603000003
--
-- Agrega edited_by y edited_at para rastrear quien y cuando
-- edito una transaccion de tipo adjustment
-- ============================================================

ALTER TABLE client_account_transactions
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id);

ALTER TABLE client_account_transactions
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
