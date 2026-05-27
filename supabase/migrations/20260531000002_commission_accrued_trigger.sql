-- =====================================================
-- COMMISSION ACCRUED — Trigger desde confirmation_logs
-- Fecha: 2026-05-31
-- Descripción:
--   Emite eventos commission_accrued cuando se confirma
--   un servicio comisionable.
--
--   commission_accrued = obligación generada
--   commission_settled = obligación pagada (trigger existente)
-- =====================================================

CREATE OR REPLACE FUNCTION fn_commission_accrued_from_confirmation_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appointment RECORD;
    v_service RECORD;
    v_employee_rate NUMERIC(5,2);
    v_commission_rate NUMERIC(5,2);
    v_commission_amount NUMERIC(14,2);
BEGIN
    SELECT id, organization_id, employee_id, is_commissionable
    INTO v_appointment
    FROM appointments
    WHERE id = NEW.appointment_id;

    IF NOT FOUND OR NOT v_appointment.is_commissionable OR v_appointment.employee_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT percentage INTO v_employee_rate
    FROM employees
    WHERE id = v_appointment.employee_id;

    FOR v_service IN
        SELECT aps.id AS appointment_service_id, s.id AS service_id, s.price, s.has_commission
        FROM appointment_services aps
        JOIN services s ON s.id = aps.service_id
        WHERE aps.appointment_id = v_appointment.id
          AND s.has_commission = true
    LOOP
        SELECT COALESCE(
            (SELECT commission_rate FROM employee_services
             WHERE employee_id = v_appointment.employee_id AND service_id = v_service.service_id),
            v_employee_rate,
            60
        ) INTO v_commission_rate;

        v_commission_amount := (v_service.price * (v_commission_rate / 100));

        INSERT INTO financial_events (
            organization_id, event_type,
            source_table, source_id,
            entity_type, entity_id,
            occurred_by_type, occurred_by_id,
            amount, currency,
            idempotency_key, status,
            metadata, occurred_at
        ) VALUES (
            v_appointment.organization_id, 'commission_accrued',
            'confirmation_logs', NEW.id,
            'appointment', v_appointment.id,
            'user', NEW.performed_by,
            v_commission_amount * -1, 'COP',
            'comm_accrued_' || NEW.id || '_' || v_service.service_id, 'settled',
            jsonb_build_object(
                'service_id', v_service.service_id,
                'appointment_service_id', v_service.appointment_service_id,
                'service_price', v_service.price,
                'commission_rate', v_commission_rate
            ),
            NEW.created_at
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commission_accrued_from_confirmation_log ON confirmation_logs;
CREATE TRIGGER trg_commission_accrued_from_confirmation_log
    AFTER INSERT ON confirmation_logs
    FOR EACH ROW
    WHEN (NEW.action IN ('confirmed', 'manually_set'))
    EXECUTE FUNCTION fn_commission_accrued_from_confirmation_log();

COMMENT ON FUNCTION fn_commission_accrued_from_confirmation_log IS
    'Emite commission_accrued events when a commissionable service is confirmed. Negative amounts per sign convention.';
