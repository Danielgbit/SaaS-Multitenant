-- =========================================================================================
-- FIX: Add metadata column to confirmation_logs
-- =========================================================================================
-- La migración anterior falló porque confirmation_logs no tenía la columna metadata.
-- Esta migración agrega la columna faltante de forma idempotente.
-- Fecha: 20 Abril 2026

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'confirmation_logs' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE confirmation_logs ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_confirmation_logs_metadata ON confirmation_logs USING GIN (metadata);
