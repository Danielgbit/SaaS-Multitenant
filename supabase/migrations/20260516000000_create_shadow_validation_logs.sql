-- Shadow Mode Phase 2A: Minimal drift detection between legacy and orchestrator
-- https://opencode.ai/docs/shadow-mode

CREATE TABLE IF NOT EXISTS shadow_validation_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  appointment_id      UUID,
  command             TEXT NOT NULL,
  correlation_id      TEXT NOT NULL,

  -- Central comparison
  legacy_result       JSONB NOT NULL,
  orchestrator_result JSONB NOT NULL,

  -- Drift detection
  drift_detected      BOOLEAN NOT NULL DEFAULT false,
  drift_detail        JSONB,

  -- Observational: row was modified between seed and capture (not necessarily drift)
  snapshot_changed    BOOLEAN NOT NULL DEFAULT false,

  -- Snapshots
  state_before        JSONB,
  state_after         JSONB NOT NULL,

  -- Metadata
  shadow_mode         TEXT NOT NULL DEFAULT 'observe_only',
  validation_version  TEXT NOT NULL,
  captured_at         TIMESTAMPTZ NOT NULL,
  actor_id            TEXT NOT NULL,
  actor_role          TEXT NOT NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shadow_org       ON shadow_validation_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shadow_appt      ON shadow_validation_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_shadow_drift     ON shadow_validation_logs(drift_detected) WHERE drift_detected = true;
CREATE INDEX IF NOT EXISTS idx_shadow_corr      ON shadow_validation_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_shadow_command   ON shadow_validation_logs(command);

-- RLS Policies (shadow mode is read-only for org members)
ALTER TABLE shadow_validation_logs ENABLE ROW LEVEL SECURITY;

-- Org members can read their own shadow logs
CREATE POLICY "org_members_read_shadow"
  ON shadow_validation_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- No writes allowed via RLS (only server-side inserts)
CREATE POLICY "server_insert_shadow"
  ON shadow_validation_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE shadow_validation_logs IS 'Shadow Mode validation logs - compares legacy behavior vs orchestrator model';
COMMENT ON COLUMN shadow_validation_logs.command IS 'Shadow command type: service:complete, payment:confirm, etc.';
COMMENT ON COLUMN shadow_validation_logs.legacy_result IS 'What the legacy system actually did';
COMMENT ON COLUMN shadow_validation_logs.orchestrator_result IS 'What the orchestrator would have done';
COMMENT ON COLUMN shadow_validation_logs.drift_detected IS 'True only when state differs (status/confirmation_status). NOT set by harmless metadata changes.';
COMMENT ON COLUMN shadow_validation_logs.snapshot_changed IS 'Observational: row was modified between seed and capture. May be harmless or invalidating.';
COMMENT ON COLUMN shadow_validation_logs.validation_version IS 'Version of validation rules used (e.g., v0-shadow-phase2a)';
