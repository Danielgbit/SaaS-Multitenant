-- =========================================================================================
-- DAILY ANALYTICS MIGRATION
-- Pre-calculated daily metrics for dashboard performance
-- =========================================================================================

-- Daily Analytics Table
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  appointments_count INT DEFAULT 0,
  appointments_completed INT DEFAULT 0,
  appointments_canceled INT DEFAULT 0,
  appointments_no_show INT DEFAULT 0,
  revenue_cents INT DEFAULT 0,
  new_clients INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_analytics_org_date ON daily_analytics(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);

-- Row Level Security
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their organization"
  ON daily_analytics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS daily_analytics_updated_at_trigger ON daily_analytics;
CREATE TRIGGER daily_analytics_updated_at_trigger
  BEFORE UPDATE ON daily_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics_updated_at();

-- Function to calculate and store daily analytics
CREATE OR REPLACE FUNCTION calculate_daily_analytics(p_organization_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
  v_appointments_count INT;
  v_appointments_completed INT;
  v_appointments_canceled INT;
  v_appointments_no_show INT;
  v_revenue_cents INT;
  v_new_clients INT;
BEGIN
  -- Count appointments
  SELECT COUNT(*)
  INTO v_appointments_count
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date;

  -- Count completed appointments
  SELECT COUNT(*)
  INTO v_appointments_completed
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date
    AND status = 'completed';

  -- Count canceled appointments
  SELECT COUNT(*)
  INTO v_appointments_canceled
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date
    AND status = 'canceled';

  -- Count no-show appointments
  SELECT COUNT(*)
  INTO v_appointments_no_show
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date
    AND status = 'no_show';

  -- Calculate revenue (from completed appointments)
  SELECT COALESCE(SUM(s.price::numeric * 100), 0)::INT
  INTO v_revenue_cents
  FROM appointments a
  JOIN appointment_services ast ON ast.appointment_id = a.id
  JOIN services s ON s.id = ast.service_id
  WHERE a.organization_id = p_organization_id
    AND DATE(a.start_time) = p_date
    AND a.status = 'completed';

  -- Count new clients
  SELECT COUNT(*)
  INTO v_new_clients
  FROM clients
  WHERE organization_id = p_organization_id
    AND DATE(created_at) = p_date;

  -- Upsert daily analytics
  INSERT INTO daily_analytics (
    organization_id,
    date,
    appointments_count,
    appointments_completed,
    appointments_canceled,
    appointments_no_show,
    revenue_cents,
    new_clients
  ) VALUES (
    p_organization_id,
    p_date,
    COALESCE(v_appointments_count, 0),
    COALESCE(v_appointments_completed, 0),
    COALESCE(v_appointments_canceled, 0),
    COALESCE(v_appointments_no_show, 0),
    COALESCE(v_revenue_cents, 0),
    COALESCE(v_new_clients, 0)
  )
  ON CONFLICT (organization_id, date) DO UPDATE SET
    appointments_count = COALESCE(EXCLUDED.appointments_count, 0),
    appointments_completed = COALESCE(EXCLUDED.appointments_completed, 0),
    appointments_canceled = COALESCE(EXCLUDED.appointments_canceled, 0),
    appointments_no_show = COALESCE(EXCLUDED.appointments_no_show, 0),
    revenue_cents = COALESCE(EXCLUDED.revenue_cents, 0),
    new_clients = COALESCE(EXCLUDED.new_clients, 0),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_daily_analytics(UUID, DATE) TO service_role;
