CREATE OR REPLACE FUNCTION public.create_public_booking_appointment(
  p_organization_id UUID,
  p_client_id UUID,
  p_employee_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
) RETURNS TABLE (appointment_id UUID, error TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_appointment_id UUID;
BEGIN
  INSERT INTO appointments (organization_id, client_id, employee_id, start_time, end_time, status, notes)
  VALUES (p_organization_id, p_client_id, p_employee_id, p_start_time, p_end_time, 'pending', p_notes)
  RETURNING id INTO v_appointment_id;

  INSERT INTO appointment_services (appointment_id, service_id)
  VALUES (v_appointment_id, p_service_id);

  RETURN QUERY SELECT v_appointment_id, NULL::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, SQLERRM::TEXT;
END;
$$;
