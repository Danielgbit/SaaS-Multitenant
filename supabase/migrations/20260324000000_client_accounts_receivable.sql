-- =====================================================
-- CLIENT ACCOUNTS RECEIVABLE - Cuentas por Cobrar a Clientes
-- Fecha: 2026-03-23
-- Descripción: Sistema de crédito y ventas de productos a clientes
-- =====================================================

-- =====================================================
-- MODIFICACIÓN: clients
-- Agregar campos de configuración de cuenta crédito
-- =====================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_warning_threshold NUMERIC(5,2) DEFAULT 80;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_credit_account BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_payment_method VARCHAR(50) DEFAULT 'cash';

-- =====================================================
-- NUEVA TABLA: client_accounts
-- Cuenta de crédito por cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS client_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_purchased NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_over_limit BOOLEAN NOT NULL DEFAULT false,
    is_at_warning_threshold BOOLEAN NOT NULL DEFAULT false,
    last_transaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_client_id ON client_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_accounts_organization_id ON client_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_accounts_balance ON client_accounts(organization_id, balance) WHERE balance > 0;

-- =====================================================
-- NUEVA TABLA: client_account_transactions
-- Todas las transacciones de la cuenta (ventas y pagos)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_account_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('sale', 'payment', 'credit', 'refund', 'adjustment')),
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    notes TEXT,
    related_transaction_id UUID REFERENCES client_account_transactions(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_account_transactions_account_id ON client_account_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_client_account_transactions_organization_id ON client_account_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_account_transactions_created_at ON client_account_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_client_account_transactions_type ON client_account_transactions(transaction_type);

-- =====================================================
-- NUEVA TABLA: client_product_sales
-- Detalle de productos vendidos en cada transacción
-- =====================================================
CREATE TABLE IF NOT EXISTS client_product_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES client_account_transactions(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    total_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_product_sales_transaction_id ON client_product_sales(transaction_id);
CREATE INDEX IF NOT EXISTS idx_client_product_sales_inventory_item_id ON client_product_sales(inventory_item_id);

-- =====================================================
-- NUEVA TABLA: client_product_discounts
-- Descuentos especiales por cliente por producto
-- =====================================================
CREATE TABLE IF NOT EXISTS client_product_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    discount_percent NUMERIC(5,2) NOT NULL,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_client_product_discounts_client_id ON client_product_discounts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_product_discounts_inventory_item_id ON client_product_discounts(inventory_item_id);

-- =====================================================
-- NUEVA TABLA: client_payment_methods
-- Métodos de pago config por organización
-- =====================================================
CREATE TABLE IF NOT EXISTS client_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'transfer', 'card', 'other')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- Los métodos de pago por defecto se insertan por organización vía la aplicación
-- o manualmente con un organization_id válido
-- Ejemplo:
-- INSERT INTO client_payment_methods (organization_id, name, code, type, sort_order) VALUES
--     ('your-org-uuid', 'Efectivo', 'cash', 'cash', 1),
--     ('your-org-uuid', 'Transferencia Bancolombia', 'bancolombia', 'transfer', 2),
--     ('your-org-uuid', 'Nequi', 'nequi', 'transfer', 3);

-- =====================================================
-- AGREGAR LÍMITE DE CRÉDITO A PLANES
-- =====================================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_credit_clients INT NOT NULL DEFAULT 100;

UPDATE plans SET max_credit_clients = 100 WHERE name ILIKE '%básico%' OR name ILIKE '%basic%';
UPDATE plans SET max_credit_clients = 500 WHERE name ILIKE '%profesional%' OR name ILIKE '%professional%';

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar balances después de transacción
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

    -- Actualizar balance
    IF NEW.transaction_type = 'sale' THEN
        v_balance = v_balance + NEW.amount;
    ELSIF NEW.transaction_type IN ('payment', 'refund') THEN
        v_balance = v_balance - NEW.amount;
    END IF;

    -- Verificar límites
    UPDATE client_accounts
    SET 
        balance = v_balance,
        total_purchased = CASE WHEN NEW.transaction_type = 'sale' THEN total_purchased + NEW.amount ELSE total_purchased END,
        total_paid = CASE WHEN NEW.transaction_type = 'payment' THEN total_paid + NEW.amount ELSE total_paid END,
        is_over_limit = v_balance > COALESCE(v_credit_limit, 0),
        is_at_warning_threshold = v_balance >= (COALESCE(v_credit_limit, 0) * COALESCE(v_warning_threshold, 80) / 100),
        last_transaction_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar balance automáticamente
CREATE OR REPLACE TRIGGER trg_update_client_account_balance
    AFTER INSERT ON client_account_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_client_account_balance();

-- Función para decrementar stock al hacer venta
CREATE OR REPLACE FUNCTION decrement_inventory_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_item_id UUID;
    v_quantity INT;
BEGIN
    FOR i IN 1..array_length(NEW.inventory_item_id, 1) LOOP
        v_item_id := NEW.inventory_item_id[i];
        v_quantity := NEW.quantity[i];
        
        UPDATE inventory_items
        SET quantity = quantity - v_quantity,
            updated_at = NOW()
        WHERE id = v_item_id AND quantity >= v_quantity;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
