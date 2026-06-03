-- ============================================================
-- Sprint 2 — voidTransaction: columnas + trigger
-- Migration: 20260603000002
-- 
-- 1. Agregar columnas is_voided, voided_by, voided_at
-- 2. Crear trigger para recalcular balance al anular
-- ============================================================

-- 1. Columnas de anulación en client_account_transactions
ALTER TABLE client_account_transactions
  ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE;

ALTER TABLE client_account_transactions
  ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id);

ALTER TABLE client_account_transactions
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

-- 2. Función para manejar anulación de transacciones
CREATE OR REPLACE FUNCTION handle_void_client_account_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_balance NUMERIC(12,2);
    v_credit_limit NUMERIC(12,2);
    v_warning_threshold NUMERIC(5,2);
    v_balance_effect NUMERIC(12,2);
BEGIN
    -- Solo ejecutar cuando is_voided cambia de FALSE a TRUE
    IF OLD.is_voided = FALSE AND NEW.is_voided = TRUE THEN
        -- Calcular efecto original de la transacción
        -- sale/adjustment: aumentaban balance → al anular, restar
        -- payment/refund: disminuían balance → al anular, sumar
        IF OLD.transaction_type IN ('sale', 'adjustment') THEN
            v_balance_effect := -OLD.amount;
        ELSIF OLD.transaction_type IN ('payment', 'refund') THEN
            v_balance_effect := OLD.amount;
        ELSE
            v_balance_effect := 0;
        END IF;

        -- Obtener balance actual
        SELECT balance, credit_limit, credit_warning_threshold
        INTO v_balance, v_credit_limit, v_warning_threshold
        FROM client_accounts
        WHERE id = NEW.account_id;

        -- Aplicar efecto
        v_balance := v_balance + v_balance_effect;

        -- Actualizar cuenta
        UPDATE client_accounts
        SET
            balance = v_balance,
            total_purchased = CASE
                WHEN OLD.transaction_type IN ('sale', 'adjustment') THEN total_purchased - OLD.amount
                ELSE total_purchased
            END,
            total_paid = CASE
                WHEN OLD.transaction_type = 'payment' THEN total_paid - OLD.amount
                ELSE total_paid
            END,
            is_over_limit = v_balance > COALESCE(v_credit_limit, 0),
            is_at_warning_threshold = v_balance >= (COALESCE(v_credit_limit, 0) * COALESCE(v_warning_threshold, 80) / 100),
            updated_at = NOW()
        WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para anulaciones
CREATE OR REPLACE TRIGGER trg_handle_void_client_account_transaction
    AFTER UPDATE ON client_account_transactions
    FOR EACH ROW
    WHEN (OLD.is_voided = FALSE AND NEW.is_voided = TRUE)
    EXECUTE FUNCTION handle_void_client_account_transaction();
