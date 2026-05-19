-- =====================================================
-- Add source_path to shadow_validation_logs
-- Date: 2026-05-17
-- Description: Track which code path produced each shadow validation record
-- =====================================================

ALTER TABLE shadow_validation_logs
ADD COLUMN source_path text;

COMMENT ON COLUMN shadow_validation_logs.source_path IS 'Identifies the code entry point that triggered shadow validation (e.g. cancelConfirmation.ts, PATCH/api/appointments)';
