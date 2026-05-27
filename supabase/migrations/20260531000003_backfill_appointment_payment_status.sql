-- =====================================================
-- BACKFILL APPOINTMENT PAYMENT STATUS
-- Fecha: 2026-05-31
-- Descripción:
--   Materializa payment_status para appointments que ya
--   tienen financial_events históricos (seed).
--   El trigger trg_materialize_appointment_payment_status
--   solo procesa inserts futuros, por lo que los datos
--   existentes deben backfillearse explícitamente.
-- =====================================================

-- Backfill payment_status desde financial_events
UPDATE appointments a
SET payment_status = derived.status
FROM (
    SELECT
        fe.entity_id AS appointment_id,
        CASE
            WHEN COALESCE(SUM(ABS(fe.amount)) FILTER (WHERE fe.event_type = 'refund_processed' AND fe.status = 'settled'), 0) > 0
                AND COALESCE(SUM(ABS(fe.amount)) FILTER (WHERE fe.event_type = 'refund_processed' AND fe.status = 'settled'), 0)
                    >= COALESCE(SUM(fe.amount) FILTER (WHERE fe.event_type = 'payment_received' AND fe.status = 'settled'), 0)
                THEN 'refunded'
            WHEN COALESCE(SUM(fe.amount) FILTER (WHERE fe.event_type = 'payment_received' AND fe.status = 'settled'), 0)
                    >= COALESCE(SUM(s.price), 0)
                THEN 'paid'
            WHEN COALESCE(SUM(fe.amount) FILTER (WHERE fe.event_type = 'payment_received' AND fe.status = 'settled'), 0) > 0
                THEN 'partial'
            ELSE 'unpaid'
        END AS status
    FROM financial_events fe
    LEFT JOIN appointment_services aps ON aps.appointment_id = fe.entity_id::uuid
    LEFT JOIN services s ON s.id = aps.service_id
    WHERE fe.entity_type = 'appointment'
      AND fe.event_type IN ('payment_received', 'refund_processed')
      AND fe.status = 'settled'
    GROUP BY fe.entity_id
) derived
WHERE a.id = derived.appointment_id::uuid
  AND (a.payment_status IS DISTINCT FROM derived.status);

COMMENT ON COLUMN appointments.payment_status IS
    'Derived from financial_events. Backfilled for historical data. Never canonical. Values: unpaid, partial, paid, refunded, credited.';
