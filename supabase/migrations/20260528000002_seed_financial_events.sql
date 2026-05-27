-- =====================================================
-- SEED FINANCIAL EVENTS FROM EXISTING DATA
-- Fecha: 2026-05-28
-- Descripción:
--   Migra datos financieros existentes a financial_events.
--   Idempotente: solo inserta si no hay eventos previos.
-- =====================================================

-- Seed: confirmation_logs → payment_received events
INSERT INTO financial_events (
    organization_id, event_type,
    source_table, source_id,
    entity_type, entity_id,
    occurred_by_type, occurred_by_id,
    amount, currency,
    idempotency_key, status,
    metadata, occurred_at, created_at
)
SELECT
    a.organization_id,
    CASE
        WHEN cl.action IN ('confirmed', 'manually_set') THEN 'payment_received'
        WHEN cl.action = 'adjusted' THEN 'adjustment_applied'
        ELSE 'payment_received'
    END,
    'confirmation_logs', cl.id,
    'appointment', a.id::text::uuid,
    'system', NULL,
    COALESCE(cl.price_after, 0),
    'COP',
    'seed_confirmation_logs_' || cl.id, 'settled',
    jsonb_build_object(
        'action', cl.action,
        'price_before', cl.price_before,
        'price_after', cl.price_after,
        'payment_method', cl.payment_method,
        'performed_by_role', cl.performed_by_role
    ),
    cl.created_at, NOW()
FROM confirmation_logs cl
JOIN appointments a ON a.id = cl.appointment_id
WHERE cl.price_after IS NOT NULL AND cl.price_after > 0
AND NOT EXISTS (SELECT 1 FROM financial_events WHERE source_table = 'confirmation_logs' AND source_id = cl.id)
LIMIT 10000;

-- Seed: client_account_transactions → payment_received / refund_processed
INSERT INTO financial_events (
    organization_id, event_type,
    source_table, source_id,
    entity_type, entity_id,
    occurred_by_type, occurred_by_id,
    amount, currency,
    idempotency_key, status,
    metadata, occurred_at, created_at
)
SELECT
    cat.organization_id,
    CASE
        WHEN cat.transaction_type = 'payment' THEN 'payment_received'
        WHEN cat.transaction_type = 'refund' THEN 'refund_processed'
        WHEN cat.transaction_type = 'sale' THEN 'payment_received'
        WHEN cat.transaction_type = 'adjustment' THEN 'adjustment_applied'
        WHEN cat.transaction_type = 'credit' THEN 'adjustment_applied'
        ELSE 'adjustment_applied'
    END,
    'client_account_transactions', cat.id,
    CASE WHEN cat.appointment_id IS NOT NULL THEN 'appointment' ELSE 'client' END,
    COALESCE(cat.appointment_id, ca.client_id),
    'system', NULL,
    CASE
        WHEN cat.transaction_type IN ('refund') THEN ABS(cat.amount) * -1
        ELSE cat.amount
    END,
    'COP',
    'seed_client_transactions_' || cat.id, 'settled',
    jsonb_build_object(
        'transaction_type', cat.transaction_type,
        'payment_method', cat.payment_method,
        'payment_reference', cat.payment_reference,
        'notes', cat.notes
    ),
    cat.created_at, NOW()
FROM client_account_transactions cat
JOIN client_accounts ca ON ca.id = cat.account_id
WHERE NOT EXISTS (SELECT 1 FROM financial_events WHERE source_table = 'client_account_transactions' AND source_id = cat.id)
LIMIT 10000;

-- Seed: payroll_items with status=paid → commission_settled
INSERT INTO financial_events (
    organization_id, event_type,
    source_table, source_id,
    entity_type, entity_id,
    occurred_by_type, occurred_by_id,
    amount, currency,
    idempotency_key, status,
    metadata, occurred_at, created_at
)
SELECT
    pp.organization_id,
    'commission_settled',
    'payroll_items', pi.id,
    'payroll', pp.id,
    'system', NULL,
    pi.total_commission * -1,
    'COP',
    'seed_payroll_items_' || pi.id, 'settled',
    jsonb_build_object(
        'period', pp.period,
        'employee_id', pi.employee_id,
        'contract_type', pi.contract_type,
        'payment_type', pi.payment_type,
        'total_services', pi.total_services,
        'base_salary', pi.base_salary,
        'gross_commission', pi.gross_commission
    ),
    pp.created_at, NOW()
FROM payroll_items pi
JOIN payroll_periods pp ON pp.id = pi.payroll_period_id
WHERE pp.status = 'paid'
AND NOT EXISTS (SELECT 1 FROM financial_events WHERE source_table = 'payroll_items' AND source_id = pi.id)
LIMIT 10000;
