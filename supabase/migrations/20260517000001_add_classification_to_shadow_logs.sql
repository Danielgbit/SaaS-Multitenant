-- Add classification to shadow_validation_logs
-- Categorizes observed operational patterns (observability only, no enforcement)

ALTER TABLE shadow_validation_logs
ADD COLUMN classification text;

COMMENT ON COLUMN shadow_validation_logs.classification IS 'Operational classification of observed behavior: SEMANTIC_DRIFT, LEGACY_SHORTCUT, POST_COMPLETION_CANCEL, HUMAN_OVERRIDE, UNKNOWN';

CREATE INDEX IF NOT EXISTS idx_shadow_classification ON shadow_validation_logs(classification) WHERE classification IS NOT NULL;
