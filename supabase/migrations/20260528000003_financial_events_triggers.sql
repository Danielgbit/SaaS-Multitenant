-- =====================================================
-- FINANCIAL EVENTS TRIGGERS
-- Fecha: 2026-05-28
-- Descripción:
--   Triggers que mantienen financial_events sincronizado
--   con cambios en tablas operacionales.
--
--   Append-only: siempre INSERT, nunca UPDATE/DELETE.
--   Correcciones se representan como nuevos eventos con
--   diferentes amounts + idempotency_key.
-- =====================================================

-- =====================================================
-- 1. Trigger: confirmation_logs → financial_event
-- =====================================================
CREATE OR REPLACE FUNCTION fn_financial_event_from_confirmation_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
    v_amount NUMERIC(12,2);
    v_event_type VARCHAR;
BEGIN
    SELECT organization_id INTO v_org_id FROM appointments WHERE id = NEW.appointment_id;
    IF NOT FOUND THEN RETURN NEW; END IF;

    v_amount := COALESCE(NEW.price_after, 0);

    IF NEW.action IN ('confirmed', 'manually_set') AND v_amount > 0 THEN
        v_event_type := 'payment_received';
    ELSIF NEW.action = 'adjusted' THEN
        v_event_type := 'adjustment_applied';
        v_amount := COALESCE(NEW.price_after, 0) - COALESCE(NEW.price_before, 0);
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO financial_events (
        organization_id, event_type,
        source_table, source_id,
        entity_type, entity_id,
        occurred_by_type, occurred_by_id,
        amount, currency,
        idempotency_key, status,
        metadata, occurred_at
    ) VALUES (
        v_org_id, v_event_type,
        'confirmation_logs', NEW.id,
        'appointment', NEW.appointment_id,
        'user', NEW.performed_by,
        v_amount, 'COP',
        'cl_' || NEW.id, 'settled',
        jsonb_build_object(
            'action', NEW.action,
            'price_before', NEW.price_before,
            'price_after', NEW.price_after,
            'payment_method', NEW.payment_method,
            'performed_by_role', NEW.performed_by_role
        ),
        NEW.created_at
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_financial_event_from_confirmation_log ON confirmation_logs;
CREATE TRIGGER trg_financial_event_from_confirmation_log
    AFTER INSERT ON confirmation_logs
    FOR EACH ROW
    WHEN (NEW.price_after IS NOT NULL AND NEW.price_after > 0)
    EXECUTE FUNCTION fn_financial_event_from_confirmation_log();

-- =====================================================
-- 2. Trigger: client_account_transactions → financial_event
-- =====================================================
CREATE OR REPLACE FUNCTION fn_financial_event_from_client_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_type VARCHAR;
    v_amount NUMERIC(12,2);
    v_entity_type VARCHAR;
    v_entity_id UUID;
    v_client_id UUID;
BEGIN
    SELECT client_id INTO v_client_id FROM client_accounts WHERE id = NEW.account_id;

    CASE NEW.transaction_type
        WHEN 'payment' THEN v_event_type := 'payment_received'; v_amount := NEW.amount;
        WHEN 'sale' THEN v_event_type := 'payment_received'; v_amount := NEW.amount;
        WHEN 'refund' THEN v_event_type := 'refund_processed'; v_amount := ABS(NEW.amount) * -1;
        WHEN 'adjustment' THEN v_event_type := 'adjustment_applied'; v_amount := NEW.amount;
        WHEN 'credit' THEN v_event_type := 'adjustment_applied'; v_amount := NEW.amount;
        ELSE v_event_type := 'adjustment_applied'; v_amount := NEW.amount;
    END CASE;

    IF NEW.appointment_id IS NOT NULL THEN
        v_entity_type := 'appointment';
        v_entity_id := NEW.appointment_id;
    ELSE
        v_entity_type := 'client';
        v_entity_id := v_client_id;
    END IF;

    INSERT INTO financial_events (
        organization_id, event_type,
        source_table, source_id,
        entity_type, entity_id,
        occurred_by_type, occurred_by_id,
        amount, currency,
        idempotency_key, status,
        metadata, occurred_at
    ) VALUES (
        NEW.organization_id, v_event_type,
        'client_account_transactions', NEW.id,
        v_entity_type, v_entity_id,
        'user', NEW.created_by,
        v_amount, 'COP',
        'cat_' || NEW.id, 'settled',
        jsonb_build_object(
            'transaction_type', NEW.transaction_type,
            'payment_method', NEW.payment_method,
            'payment_reference', NEW.payment_reference,
            'balance_after', NEW.balance_after,
            'notes', NEW.notes,
            'related_transaction_id', NEW.related_transaction_id
        ),
        NEW.created_at
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_financial_event_from_client_transaction ON client_account_transactions;
CREATE TRIGGER trg_financial_event_from_client_transaction
    AFTER INSERT ON client_account_transactions
    FOR EACH ROW
    EXECUTE FUNCTION fn_financial_event_from_client_transaction();

-- =====================================================
-- 3. Trigger: payroll_items (when marked as paid)
--    Este trigger escucha cambios de status en payroll_periods
--    porque payroll_items se pagan en bloque por período.
-- =====================================================
CREATE OR REPLACE FUNCTION fn_financial_events_from_paid_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        FOR v_item IN
            SELECT pi.id, pi.employee_id, pi.gross_commission, pi.net_pay
            FROM payroll_items pi
            WHERE pi.payroll_period_id = NEW.id
        LOOP
            INSERT INTO financial_events (
                organization_id, event_type,
                source_table, source_id,
                entity_type, entity_id,
                occurred_by_type, occurred_by_id,
                amount, currency,
                idempotency_key, status,
                metadata, occurred_at
            ) VALUES (
                NEW.organization_id, 'commission_settled',
                'payroll_items', v_item.id,
                'payroll', NEW.id,
                'worker', NULL,
                COALESCE(v_item.gross_commission, 0) * -1, 'COP',
                'pi_' || v_item.id || '_paid', 'settled',
                jsonb_build_object('employee_id', v_item.employee_id, 'net_pay', v_item.net_pay),
                NOW()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_financial_events_from_paid_period ON payroll_periods;
CREATE TRIGGER trg_financial_events_from_paid_period
    AFTER UPDATE OF status ON payroll_periods
    FOR EACH ROW
    WHEN (NEW.status = 'paid')
    EXECUTE FUNCTION fn_financial_events_from_paid_period();

-- =====================================================
-- 4. Materializar appointment.payment_status desde financial_events
-- =====================================================
CREATE OR REPLACE FUNCTION fn_materialize_appointment_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appointment_id UUID;
    v_total_paid NUMERIC(12,2);
    v_total_refunded NUMERIC(12,2);
    v_service_price NUMERIC(12,2);
    v_payment_status VARCHAR;
BEGIN
    -- Determinar el appointment_id según la fuente
    IF TG_OP = 'INSERT' THEN
        IF NEW.entity_type = 'appointment' THEN
            v_appointment_id := NEW.entity_id;
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Calcular total pagado desde eventos
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM financial_events
    WHERE entity_type = 'appointment'
      AND entity_id = v_appointment_id
      AND event_type = 'payment_received'
      AND status = 'settled';

    -- Calcular total reembolsado
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_refunded
    FROM financial_events
    WHERE entity_type = 'appointment'
      AND entity_id = v_appointment_id
      AND event_type = 'refund_processed'
      AND status = 'settled';

    -- Obtener precio del servicio desde appointment_services
    SELECT COALESCE(SUM(s.price), 0) INTO v_service_price
    FROM appointment_services aps
    JOIN services s ON s.id = aps.service_id
    WHERE aps.appointment_id = v_appointment_id;

    -- Determinar estado derivado
    IF v_total_refunded > 0 AND v_total_refunded >= v_total_paid THEN
        v_payment_status := 'refunded';
    ELSIF v_total_paid >= v_service_price AND v_service_price > 0 THEN
        v_payment_status := 'paid';
    ELSIF v_total_paid > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    -- Actualizar appointment (derived state, never canonical)
    UPDATE appointments SET payment_status = v_payment_status
    WHERE id = v_appointment_id AND (
        payment_status IS DISTINCT FROM v_payment_status
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_materialize_appointment_payment_status ON financial_events;
CREATE TRIGGER trg_materialize_appointment_payment_status
    AFTER INSERT ON financial_events
    FOR EACH ROW
    EXECUTE FUNCTION fn_materialize_appointment_payment_status();
