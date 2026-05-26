-- =====================================================
-- FIX: Payroll Security - RLS for V1 tables + payroll_config
-- Fecha: 2026-05-27
-- Descripción:
--   - Agrega RLS a 5 tablas V1 de payroll sin protección
--   - Corrige payroll_config policy (USING true → admin scope)
-- =====================================================

-- =====================================================
-- 1. RLS: organization_payroll_settings
-- =====================================================
ALTER TABLE organization_payroll_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_payroll_settings" ON organization_payroll_settings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "org_admins_manage_payroll_settings" ON organization_payroll_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- 2. RLS: employee_loans
-- =====================================================
ALTER TABLE employee_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_employee_loans" ON employee_loans
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "org_admins_manage_employee_loans" ON employee_loans
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- 3. RLS: payroll_receipts
-- =====================================================
ALTER TABLE payroll_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_payroll_receipts" ON payroll_receipts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "org_admins_manage_payroll_receipts" ON payroll_receipts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- 4. RLS: payroll_receipt_services (no org_id directo)
-- =====================================================
ALTER TABLE payroll_receipt_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_payroll_receipt_services" ON payroll_receipt_services
    FOR SELECT USING (
        receipt_id IN (
            SELECT id FROM payroll_receipts WHERE organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "org_admins_manage_payroll_receipt_services" ON payroll_receipt_services
    FOR ALL USING (
        receipt_id IN (
            SELECT id FROM payroll_receipts WHERE organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- =====================================================
-- 5. RLS: payroll_receipt_loans (no org_id directo)
-- =====================================================
ALTER TABLE payroll_receipt_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_payroll_receipt_loans" ON payroll_receipt_loans
    FOR SELECT USING (
        receipt_id IN (
            SELECT id FROM payroll_receipts WHERE organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "org_admins_manage_payroll_receipt_loans" ON payroll_receipt_loans
    FOR ALL USING (
        receipt_id IN (
            SELECT id FROM payroll_receipts WHERE organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- =====================================================
-- 6. FIX: payroll_config policy
--    Antes: USING (true) → cualquier authenticated user
--    Ahora: solo owner_saas (super admin)
-- =====================================================
DROP POLICY IF EXISTS "System admins can manage payroll_config" ON payroll_config;

CREATE POLICY "super_admins_manage_payroll_config" ON payroll_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid() AND role = 'owner_saas'
        )
    );
