-- =====================================================
-- PAYROLL v2 - Nuevo Modelo
-- Fecha: 2026-05-03
-- Descripción: Sistema de nómina robusto para Colombia
--   - payroll_config: SMMLV configurable por año
--   - payroll_periods: períodos formales (YYYY-MM)
--   - payroll_items: detalle por empleado en período
--   - period_commissions: comisiones persistidas
-- =====================================================

-- =====================================================
-- 1. Tabla global: payroll_config (no multi-tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL UNIQUE,
    smmlv INTEGER NOT NULL,
    transport_subsidy INTEGER NOT NULL,
    health_rate NUMERIC(4,2) DEFAULT 0.04,
    pension_rate NUMERIC(4,2) DEFAULT 0.04,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_config_year ON payroll_config(year);

-- =====================================================
-- 2. Modificar employees: añadir contract_type y otros
-- =====================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20)
    CHECK (contract_type IN ('laboral', 'prestacion')) DEFAULT 'prestacion';

ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_transport_subsidy BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS force_transport_subsidy BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN employees.contract_type IS 'Tipo de vinculación: laboral (con deducciones) o prestacion (sin deducciones)';
COMMENT ON COLUMN employees.has_transport_subsidy IS 'Si recibe auxilio de transporte manualmente';
COMMENT ON COLUMN employees.force_transport_subsidy IS 'Forzar pago de transporte aunque supere 2 SMMLV';

-- =====================================================
-- 3. Modificar organization_payroll_settings
-- =====================================================
ALTER TABLE organization_payroll_settings ADD COLUMN IF NOT EXISTS cut_off_day INTEGER
    DEFAULT 31 CHECK (cut_off_day BETWEEN 1 AND 31);

COMMENT ON COLUMN organization_payroll_settings.cut_off_day IS 'Día de corte del período: 31 = último día del mes';

-- =====================================================
-- 4. Nueva tabla: payroll_periods
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL CHECK (period ~ '^\d{4}-\d{2}$'),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    total_employees INTEGER DEFAULT 0,
    total_gross_pay NUMERIC(14,2) DEFAULT 0,
    total_deductions NUMERIC(14,2) DEFAULT 0,
    total_net_pay NUMERIC(14,2) DEFAULT 0,
    total_transport_subsidy NUMERIC(14,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, period)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_org_period ON payroll_periods(organization_id, period);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);

-- =====================================================
-- 5. Nueva tabla: payroll_items
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('laboral', 'prestacion')),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('fijo', 'porcentaje', 'mixed')),

    -- Comisiones
    total_services INTEGER DEFAULT 0,
    gross_commission NUMERIC(14,2) DEFAULT 0,

    -- Salario fijo
    base_salary NUMERIC(14,2) DEFAULT 0,
    salary_frequency VARCHAR(20),

    -- Auxilio de transporte
    has_transport_subsidy BOOLEAN DEFAULT FALSE,
    transport_subsidy_amount NUMERIC(14,2) DEFAULT 0,

    -- Deducciones
    health_deduction NUMERIC(14,2) DEFAULT 0,
    pension_deduction NUMERIC(14,2) DEFAULT 0,
    total_deductions NUMERIC(14,2) DEFAULT 0,

    -- Totales
    gross_pay NUMERIC(14,2) DEFAULT 0,
    net_pay NUMERIC(14,2) DEFAULT 0,

    -- Préstamos
    loans_deducted NUMERIC(14,2) DEFAULT 0,

    -- Notas
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(payroll_period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_period ON payroll_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);

-- =====================================================
-- 6. Nueva tabla: period_commissions
-- =====================================================
CREATE TABLE IF NOT EXISTS period_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_item_id UUID NOT NULL REFERENCES payroll_items(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    service_date DATE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_value NUMERIC(14,2) NOT NULL,
    percentage_applied NUMERIC(5,2) NOT NULL,
    commission_amount NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(payroll_item_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_period_commissions_item ON period_commissions(payroll_item_id);
CREATE INDEX IF NOT EXISTS idx_period_commissions_service_date ON period_commissions(service_date);

-- =====================================================
-- 7. Tabla: payroll_item_loans (préstamos deducidos por período)
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_item_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_item_id UUID NOT NULL REFERENCES payroll_items(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES employee_loans(id),
    amount_deducted NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_item_loans_item ON payroll_item_loans(payroll_item_id);
CREATE INDEX IF NOT EXISTS idx_payroll_item_loans_loan ON payroll_item_loans(loan_id);

-- =====================================================
-- 8. RLS Policies (Row Level Security)
-- =====================================================

-- Payroll_config es global, solo admins del sistema
ALTER TABLE payroll_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System admins can manage payroll_config" ON payroll_config
    FOR ALL USING (true);

-- payroll_periods: solo miembros de la org
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view payroll_periods" ON payroll_periods
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Org admins can manage payroll_periods" ON payroll_periods
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- payroll_items: solo miembros de la org
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view payroll_items" ON payroll_items
    FOR SELECT USING (
        payroll_period_id IN (
            SELECT id FROM payroll_periods WHERE organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
        )
    );
CREATE POLICY "Org admins can manage payroll_items" ON payroll_items
    FOR ALL USING (
        payroll_period_id IN (
            SELECT id FROM payroll_periods WHERE organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- period_commissions: mismos permisos que payroll_items
ALTER TABLE period_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view period_commissions" ON period_commissions
    FOR SELECT USING (
        payroll_item_id IN (
            SELECT id FROM payroll_items WHERE payroll_period_id IN (
                SELECT id FROM payroll_periods WHERE organization_id IN (
                    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
                )
            )
        )
    );
CREATE POLICY "Org admins can manage period_commissions" ON period_commissions
    FOR ALL USING (
        payroll_item_id IN (
            SELECT id FROM payroll_items WHERE payroll_period_id IN (
                SELECT id FROM payroll_periods WHERE organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
                )
            )
        )
    );

-- payroll_item_loans: mismos permisos
ALTER TABLE payroll_item_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view payroll_item_loans" ON payroll_item_loans
    FOR SELECT USING (
        payroll_item_id IN (
            SELECT id FROM payroll_items WHERE payroll_period_id IN (
                SELECT id FROM payroll_periods WHERE organization_id IN (
                    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
                )
            )
        )
    );
CREATE POLICY "Org admins can manage payroll_item_loans" ON payroll_item_loans
    FOR ALL USING (
        payroll_item_id IN (
            SELECT id FROM payroll_items WHERE payroll_period_id IN (
                SELECT id FROM payroll_periods WHERE organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
                )
            )
        )
    );

-- =====================================================
-- 9. Functions y Triggers
-- =====================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para payroll_periods
CREATE TRIGGER update_payroll_periods_updated_at
    BEFORE UPDATE ON payroll_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para payroll_items
CREATE TRIGGER update_payroll_items_updated_at
    BEFORE UPDATE ON payroll_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para payroll_config
CREATE TRIGGER update_payroll_config_updated_at
    BEFORE UPDATE ON payroll_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 10. Seed: payroll_config para 2026
-- =====================================================
INSERT INTO payroll_config (year, smmlv, transport_subsidy, health_rate, pension_rate)
VALUES (2026, 1750905, 249095, 0.04, 0.04)
ON CONFLICT (year) DO NOTHING;

COMMENT ON TABLE payroll_config IS 'Configuración nacional de nómina: SMMLV y tasas';
COMMENT ON TABLE payroll_periods IS 'Períodos de nómina formales (YYYY-MM)';
COMMENT ON TABLE payroll_items IS 'Detalle de pago por empleado por período';
COMMENT ON TABLE period_commissions IS 'Comisiones persistidas por servicio';
COMMENT ON TABLE payroll_item_loans IS 'Préstamos deducidos por período';