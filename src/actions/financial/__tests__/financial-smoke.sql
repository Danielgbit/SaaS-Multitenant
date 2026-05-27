-- =====================================================
-- FINANCIAL SMOKE TEST — Verificación del loop crítico
-- =====================================================
-- Ejecutar en orden contra una DB real (Supabase SQL Editor o psql)
-- Después de aplicar las migrations 20260528000001..20260531000001
-- =====================================================

-- =====================================================
-- 1. Verificar estructura de financial_events
-- =====================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'financial_events'
ORDER BY ordinal_position;

-- =====================================================
-- 2. Verificar append-only enforcement
-- =====================================================
-- 2a. REVOKE funciona: authenticated NO puede UPDATE/DELETE
-- (ejecutar como authenticated, no service_role)
-- EXPECTED: ERROR: permission denied
-- UPDATE financial_events SET status = 'reversed' WHERE id = 'nonexistent';

-- 2b. Trigger protector (service_role aún puede hacerlo)
-- BEGIN;
--   UPDATE financial_events SET status = 'reversed'
--   WHERE id = 'some-id' AND status != 'reversed';
--   -- EXPECTED: 1 row affected
--   UPDATE financial_events SET status = 'reversed'
--   WHERE id = 'some-id';
--   -- EXPECTED: ERROR (already reversed)
-- ROLLBACK;

-- 2c. DELETE siempre bloqueado (incluso para service_role)
-- EXPECTED: ERROR
-- DELETE FROM financial_events WHERE id = 'nonexistent';

-- =====================================================
-- 3. Verificar loop: appointment → confirmation → transaction → event → payment_status
-- =====================================================
-- 3a. Elegir un appointment de prueba
-- NOTA: Reemplazar con IDs reales de tu DB
-- WITH test_appointment AS (
--   SELECT id, organization_id, client_id, employee_id
--   FROM appointments
--   WHERE status = 'pending'
--   LIMIT 1
-- )
-- SELECT * FROM test_appointment;

-- 3b. Verificar que confirmation_logs genera financial_event
-- Después de que un employee ejecute markCompleted:
-- SELECT fe.event_type, fe.amount, fe.status, fe.source_table, fe.idempotency_key
-- FROM financial_events fe
-- WHERE fe.source_table = 'confirmation_logs'
--   AND fe.entity_type = 'appointment'
-- ORDER BY fe.created_at DESC
-- LIMIT 5;
-- EXPECTED:
--   - event_type = 'payment_received'
--   - amount > 0
--   - status = 'settled'

-- 3c. Verificar que client_account_transactions genera financial_event
-- Después de que reception ejecute confirmService con payment_method:
-- SELECT fe.event_type, fe.amount, fe.status, fe.source_table, fe.idempotency_key
-- FROM financial_events fe
-- WHERE fe.source_table = 'client_account_transactions'
--   AND fe.entity_type = 'appointment'
-- ORDER BY fe.created_at DESC
-- LIMIT 5;
-- EXPECTED:
--   - event_type = 'payment_received'
--   - amount > 0
--   - status = 'settled'

-- 3d. Verificar que payment_status se derivó correctamente
-- SELECT a.id, a.payment_status, a.total_amount
-- FROM appointments a
-- WHERE a.payment_status IS NOT NULL
-- ORDER BY a.updated_at DESC
-- LIMIT 10;
-- EXPECTED:
--   - payment_status IN ('unpaid', 'partial', 'paid', 'refunded')
--   - Consistente con la suma de financial_events

-- =====================================================
-- 4. Idempotencia — no duplicados
-- =====================================================
-- 4a. Misma idempotency_key no puede aparecer dos veces
-- (La UNIQUE constraint lo garantiza)
-- SELECT idempotency_key, COUNT(*) as dupes
-- FROM financial_events
-- WHERE idempotency_key IS NOT NULL
-- GROUP BY idempotency_key
-- HAVING COUNT(*) > 1;
-- EXPECTED: 0 rows

-- 4b. Mismo source_table + source_id no genera 2 eventos
-- (Cada trigger construye idempotency_key con el source_id)
-- SELECT source_table, source_id, COUNT(*) as dupes
-- FROM financial_events
-- GROUP BY source_table, source_id
-- HAVING COUNT(*) > 1;
-- EXPECTED: 0 rows

-- =====================================================
-- 5. Reconciliación: SUM(events) vs payment_status
-- =====================================================
-- Comparar el payment_status derivado por el trigger
-- contra el payment_status calculado en esta query
-- Si hay discrepancia, el dominio tiene drift.
SELECT
  a.id,
  a.payment_status AS status_db,
  COALESCE(SUM(fe.amount) FILTER (WHERE fe.event_type = 'payment_received' AND fe.status = 'settled'), 0) AS total_paid,
  COALESCE(SUM(ABS(fe.amount)) FILTER (WHERE fe.event_type = 'refund_processed' AND fe.status = 'settled'), 0) AS total_refunded,
  COALESCE(SUM(s.price), 0) AS service_price,
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
  END AS status_derived
FROM appointments a
LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
LEFT JOIN services s ON s.id = aps.service_id
LEFT JOIN financial_events fe
  ON fe.entity_type = 'appointment'
  AND fe.entity_id = a.id
  AND fe.event_type IN ('payment_received', 'refund_processed')
  AND fe.status = 'settled'
GROUP BY a.id
HAVING a.payment_status IS DISTINCT FROM CASE
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
END;
-- EXPECTED: 0 rows (ninguna discrepancia)
