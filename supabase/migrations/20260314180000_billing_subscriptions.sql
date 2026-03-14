-- =========================================================================================
-- BILLING & SUBSCRIPTIONS MIGRATION
-- Adds payment methods, invoices, payments, and WhatsApp activation requests
-- =========================================================================================

-- =========================================================================================
-- 1. PAYMENT METHODS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL DEFAULT 'card',
    last4 VARCHAR(4),
    brand VARCHAR,
    exp_month INT,
    exp_year INT,
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON payment_methods(organization_id);

-- =========================================================================================
-- 2. INVOICES
-- =========================================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_invoice_id VARCHAR,
    invoice_number VARCHAR,
    amount_cents INT NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'eur',
    status VARCHAR NOT NULL DEFAULT 'draft',
    tax_amount_cents INT DEFAULT 0,
    subtotal_cents INT NOT NULL,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    invoice_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);

-- =========================================================================================
-- 3. PAYMENTS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id),
    stripe_payment_intent_id VARCHAR,
    amount_cents INT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- =========================================================================================
-- 4. WHATSAPP ACTIVATION REQUESTS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS whatsapp_activation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_name VARCHAR NOT NULL,
    business_phone VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_requests_org ON whatsapp_activation_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_requests_status ON whatsapp_activation_requests(status);

-- =========================================================================================
-- 5. UPDATE SUBSCRIPTIONS TABLE
-- =========================================================================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================================
-- 6. UPDATE PLANS TABLE
-- =========================================================================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- =========================================================================================
-- 7. ROW LEVEL SECURITY
-- =========================================================================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_activation_requests ENABLE ROW LEVEL SECURITY;

-- Payment Methods: Only org members can access
CREATE POLICY "Org can manage own payment methods"
ON payment_methods FOR ALL
USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

-- Invoices: Only org members can view
CREATE POLICY "Org can view own invoices"
ON invoices FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

-- Payments: Only org members can view
CREATE POLICY "Org can view own payments"
ON payments FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

-- WhatsApp Activation: Only org members can manage
CREATE POLICY "Org can manage own WhatsApp requests"
ON whatsapp_activation_requests FOR ALL
USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

-- =========================================================================================
-- 8. SEED DATA: PLANS
-- =========================================================================================
INSERT INTO plans (name, price, max_employees, max_services, whatsapp_enabled, stripe_price_id, description, features) VALUES
(
    'Básico',
    0,
    1,
    3,
    false,
    NULL,
    'Perfecto para profesionales independientes',
    '["1 empleado", "3 servicios", "Calendario básico", "Reservas online"]'
) ON CONFLICT DO NOTHING;

INSERT INTO plans (name, price, max_employees, max_services, whatsapp_enabled, stripe_price_id, description, features) VALUES
(
    'Profesional',
    29.99,
    5,
    10,
    true,
    'price_pro_monthly',
    'Para negocios en crecimiento',
    '["5 empleados", "10 servicios", "Recordatorios WhatsApp", "Informes avanzados", "优先 soporte"]'
) ON CONFLICT DO NOTHING;

INSERT INTO plans (name, price, max_employees, max_services, whatsapp_enabled, stripe_price_id, description, features) VALUES
(
    'Enterprise',
    79.99,
    -1,
    -1,
    true,
    'price_enterprise_monthly',
    'Para grandes equipos',
    '["Empleados ilimitados", "Servicios ilimitados", "WhatsApp Premium", "API access", "Soporte dedicado"]'
) ON CONFLICT DO NOTHING;

-- =========================================================================================
-- 9. UPDATE EXISTING TRIAL SUBSCRIPTIONS
-- =========================================================================================
UPDATE subscriptions 
SET trial_started_at = created_at,
    trial_ends_at = created_at + INTERVAL '30 days'
WHERE status = 'trial' AND trial_ends_at IS NULL;

-- =========================================================================================
-- 10. ADD STRIPE_PRICE_ID TO EXISTING PLANS (if not already)
-- =========================================================================================
UPDATE plans SET stripe_price_id = 'price_pro_monthly' WHERE name = 'Profesional' AND stripe_price_id IS NULL;
UPDATE plans SET stripe_price_id = 'price_enterprise_monthly' WHERE name = 'Enterprise' AND stripe_price_id IS NULL;
