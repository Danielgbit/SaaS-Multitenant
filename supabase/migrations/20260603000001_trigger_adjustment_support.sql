-- ============================================================
-- Sprint 1 — Soporte para adjustment en trigger de balance
-- Migration: 20260603000001
-- 
-- Actualiza update_client_account_balance() para manejar
-- transaction_type = 'adjustment' (cargo que aumenta deuda)
-- ============================================================

CREATE OR REPLACE FUNCTION update_client_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_balance NUMERIC(12,2);
    v_credit_limit NUMERIC(12,2);
    v_warning_threshold NUMERIC(5,2);
BEGIN
    -- Calcular nuevo balance
    SELECT balance, credit_limit, credit_warning_threshold
    INTO v_balance, v_credit_limit, v_warning_threshold
    FROM client_accounts
    WHERE id = NEW.account_id;

    -- Actualizar balance según tipo de transacción
    IF NEW.transaction_type IN ('sale', 'adjustment') THEN
        v_balance = v_balance + NEW.amount;
    ELSIF NEW.transaction_type IN ('payment', 'refund') THEN
        v_balance = v_balance - NEW.amount;
    END IF;

    -- Verificar límites
    UPDATE client_accounts
    SET 
        balance = v_balance,
        total_purchased = CASE WHEN NEW.transaction_type IN ('sale', 'adjustment') THEN total_purchased + NEW.amount ELSE total_purchased END,
        total_paid = CASE WHEN NEW.transaction_type = 'payment' THEN total_paid + NEW.amount ELSE total_paid END,
        is_over_limit = v_balance > COALESCE(v_credit_limit, 0),
        is_at_warning_threshold = v_balance >= (COALESCE(v_credit_limit, 0) * COALESCE(v_warning_threshold, 80) / 100),
        last_transaction_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
