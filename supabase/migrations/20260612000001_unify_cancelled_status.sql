-- Unify appointments.status spelling: 'canceled' → 'cancelled'
-- B1: Backfill existing orphan record
UPDATE appointments SET status = 'cancelled' WHERE status = 'canceled';

-- B2: Update calculate_daily_analytics function to use 'cancelled'
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
  SELECT COUNT(*)
  INTO v_appointments_count
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date;

  SELECT COUNT(*)
  INTO v_appointments_completed
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date
    AND status = 'completed';

  SELECT COUNT(*)
  INTO v_appointments_canceled
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date
    AND status = 'cancelled';

  SELECT COUNT(*)
  INTO v_appointments_no_show
  FROM appointments
  WHERE organization_id = p_organization_id
    AND DATE(start_time) = p_date
    AND status = 'no_show';

  SELECT COALESCE(SUM(s.price::numeric * 100), 0)::INT
  INTO v_revenue_cents
  FROM appointments a
  JOIN appointment_services ast ON ast.appointment_id = a.id
  JOIN services s ON s.id = ast.service_id
  WHERE a.organization_id = p_organization_id
    AND DATE(a.start_time) = p_date
    AND a.status = 'completed';

  SELECT COUNT(*)
  INTO v_new_clients
  FROM clients
  WHERE organization_id = p_organization_id
    AND DATE(created_at) = p_date;

  INSERT INTO daily_analytics (
    organization_id, date, appointments_count,
    appointments_completed, appointments_canceled, appointments_no_show,
    revenue_cents, new_clients
  ) VALUES (
    p_organization_id, p_date,
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

-- B3: Add CHECK constraint to prevent future divergence
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- B4: Deprecate unused appointment_status enum
COMMENT ON TYPE appointment_status IS
  'DEPRECATED: Not used. Column appointments.status is VARCHAR with CHECK constraint. Use ''cancelled'' (double L).';
