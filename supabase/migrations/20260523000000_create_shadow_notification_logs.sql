-- =====================================================
-- Shadow Notification Logs
-- Fecha: 2026-05-23
-- Descripción: Tablas para validación shadow V1 vs V2
-- =====================================================

-- shadow_notification_seeds: captura del envío V1 + snapshots V2
CREATE TABLE IF NOT EXISTS shadow_notification_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  appointment_id UUID NOT NULL,
  v1_snapshot JSONB NOT NULL,
  snapshot_version TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  claimed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- shadow_notification_logs: resultado de comparación V1 vs V2
CREATE TABLE IF NOT EXISTS shadow_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES shadow_notification_seeds(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  appointment_id UUID NOT NULL,
  v1_normalized JSONB NOT NULL,
  v2_normalized JSONB NOT NULL,
  drift_types TEXT[] NOT NULL DEFAULT '{}',
  drift_score INT NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'none',
  comparison_detail JSONB NOT NULL,
  comparison_version TEXT NOT NULL,
  snapshot_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes para queries eficientes
CREATE INDEX IF NOT EXISTS idx_seeds_status ON shadow_notification_seeds(status, created_at);
CREATE INDEX IF NOT EXISTS idx_seeds_org ON shadow_notification_seeds(organization_id);
CREATE INDEX IF NOT EXISTS idx_seeds_appointment ON shadow_notification_seeds(appointment_id);
CREATE INDEX IF NOT EXISTS idx_logs_org ON shadow_notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_logs_severity ON shadow_notification_logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_score ON shadow_notification_logs(drift_score);
CREATE INDEX IF NOT EXISTS idx_logs_drift_types ON shadow_notification_logs USING GIN(drift_types);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON shadow_notification_logs(created_at DESC);

-- RLS policies
ALTER TABLE shadow_notification_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_notification_logs ENABLE ROW LEVEL SECURITY;

-- Seeds: org members can view their own
CREATE POLICY "org_members_view_seeds" ON shadow_notification_seeds
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Logs: org members can view their own
CREATE POLICY "org_members_view_logs" ON shadow_notification_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- System role can insert (for seeder and runner)
CREATE POLICY "system_insert_seeds" ON shadow_notification_seeds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_insert_logs" ON shadow_notification_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_update_seeds" ON shadow_notification_seeds
  FOR UPDATE USING (true);
