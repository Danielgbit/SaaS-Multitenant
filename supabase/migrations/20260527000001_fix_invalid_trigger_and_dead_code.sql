-- =====================================================
-- FIX: Invalid trigger syntax + dead inventory function
-- Fecha: 2026-05-27
-- Descripción:
--   - Corrige CREATE OR REPLACE TRIGGER (sintaxis inválida)
--   - Elimina función decrement_inventory_on_sale() (rota, no usada)
-- =====================================================

-- =====================================================
-- 1. Fix: trg_update_client_account_balance
--    PostgreSQL no soporta CREATE OR REPLACE TRIGGER
--    Se elimina y recrea con sintaxis correcta
-- =====================================================
DROP TRIGGER IF EXISTS trg_update_client_account_balance ON client_account_transactions;

CREATE TRIGGER trg_update_client_account_balance
    AFTER INSERT ON client_account_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_client_account_balance();

-- =====================================================
-- 2. Drop: decrement_inventory_on_sale()
--    Función rota: usa NEW.inventory_item_id[i] como array
--    pero las columnas son escalares (UUID, INT)
--    Ningún trigger la referencia → código muerto
-- =====================================================
DROP FUNCTION IF EXISTS decrement_inventory_on_sale();
