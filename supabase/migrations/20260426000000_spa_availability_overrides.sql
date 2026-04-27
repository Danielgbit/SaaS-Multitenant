-- ================================================================
-- SPA Availability Overrides (Global)
-- Purpose: Días especiales globales del spa (cierre total o horario especial)
-- Date: 2026-04-26
-- ================================================================

CREATE TABLE IF NOT EXISTS spa_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_day_off BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_org_date_override UNIQUE (organization_id, date),
  CONSTRAINT check_override_times CHECK (
    (is_day_off = true) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

-- Index para búsqueda eficiente por org + fecha
CREATE INDEX IF NOT EXISTS idx_spa_overrides_org_date
  ON spa_availability_overrides(organization_id, date);

-- Index para días libres (facilita encontrar cierres totales)
CREATE INDEX IF NOT EXISTS idx_spa_overrides_day_off
  ON spa_availability_overrides(date)
  WHERE is_day_off = true;

-- ================================================================
-- RLS Policies
-- ================================================================

ALTER TABLE spa_availability_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Miembros pueden ver overrides de su org
DROP POLICY IF EXISTS "members_can_view_spa_overrides" ON spa_availability_overrides;
CREATE POLICY "members_can_view_spa_overrides" ON spa_availability_overrides
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Admin/Owner/Assistant pueden gestionar overrides
DROP POLICY IF EXISTS "admins_can_manage_spa_overrides" ON spa_availability_overrides;
CREATE POLICY "admins_can_manage_spa_overrides" ON spa_availability_overrides
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'assistant')
    )
  );

-- ================================================================
-- Comments
-- ================================================================

COMMENT ON TABLE spa_availability_overrides IS 'Overrides globales del spa - días de cierre total o horario especial (ej: mantenimiento, feriados)';
COMMENT ON COLUMN spa_availability_overrides.is_day_off IS 'Si true, el spa está cerrado todo el día';
COMMENT ON COLUMN spa_availability_overrides.start_time IS 'Hora de inicio del override. Null = día completo';
COMMENT ON COLUMN spa_availability_overrides.end_time IS 'Hora de fin del override. Null = día completo';