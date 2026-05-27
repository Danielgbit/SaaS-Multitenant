-- =====================================================
-- PROTECT FINANCIAL EVENTS — Append-only enforcement
-- Fecha: 2026-05-31
-- Descripción:
--   Garantiza que financial_events sea efectivamente
--   append-only a nivel de base de datos.
--
--   La verdad canónica del dominio financiero no puede
--   depender de disciplina humana.
-- =====================================================

-- 1. Revocar UPDATE/DELETE de authenticated (service_role mantiene permisos
--    para operaciones legítimas de reversión vía status = 'reversed')
REVOKE UPDATE, DELETE ON financial_events FROM authenticated;

-- 2. Trigger protector (defense in depth)
--    Permite UPDATE solo para cambiar status a 'reversed' (reversión controlada).
--    Bloquea cualquier DELETE.
CREATE OR REPLACE FUNCTION fn_prevent_financial_events_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Permitir reversión controlada: cambiar status a 'reversed' por única vez
        IF OLD.status != NEW.status
           AND NEW.status = 'reversed'
           AND OLD.status != 'reversed'
        THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'financial_events is append-only. Only allowed mutation is status -> reversed.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'financial_events is append-only. Deletion is never allowed.';
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_financial_events_mutation ON financial_events;
CREATE TRIGGER trg_prevent_financial_events_mutation
    BEFORE UPDATE OR DELETE ON financial_events
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_financial_events_mutation();

-- 3. Actualizar comentario de tabla
COMMENT ON TABLE financial_events IS
    'Canonical append-only financial ledger. Append-only enforced via REVOKE + trigger. Corrections use status -> reversed.';

COMMENT ON COLUMN financial_events.status IS
    'pending=recently created, settled=finalized, reversed=corrected. Append-only: no updates/deletes, only new events.';
