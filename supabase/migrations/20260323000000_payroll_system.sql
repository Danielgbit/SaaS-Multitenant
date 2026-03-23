-- =====================================================
-- PAYROLL SYSTEM - Nómina y Comisiones
-- Fecha: 2026-03-23
-- Descripción: Sistema completo de nómina incluyendo:
--   - Configuración de comisiones por empleado
--   - Préstamos y deudas de empleados
--   - Generación de recibos de nómina
-- =====================================================

-- =====================================================
-- MODIFICACIÓN: employees
-- Agregar campos de configuración de nómina
-- =====================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC(5,2) DEFAULT 60;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'commission' CHECK (payment_type IN ('commission', 'salary', 'mixed'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fixed_salary NUMERIC(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_frequency VARCHAR(20) CHECK (salary_frequency IN ('weekly', 'biweekly', 'monthly'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS max_debt_limit NUMERIC(12,2) DEFAULT 200;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS debt_warning_threshold NUMERIC(5,2) DEFAULT 80;

-- =====================================================
-- MODIFICACIÓN: employee_services
-- Agregar override de tasa de comisión por servicio
-- =====================================================
ALTER TABLE employee_services ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2);

-- =====================================================
-- MODIFICACIÓN: services
-- Agregar flag para indicar si genera comisión
-- =====================================================
ALTER TABLE services ADD COLUMN IF NOT EXISTS has_commission BOOLEAN DEFAULT true;

-- =====================================================
-- MODIFICACIÓN: appointments
-- Agregar flag para indicar si es commissionable
-- =====================================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_commissionable BOOLEAN DEFAULT true;

-- =====================================================
-- NUEVA TABLA: organization_payroll_settings
-- Configuración global de nómina por organización
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payroll_type VARCHAR(20) NOT NULL DEFAULT 'weekly' CHECK (payroll_type IN ('weekly', 'biweekly', 'monthly', 'adhoc')),
    week_starts_on INTEGER DEFAULT 0 CHECK (week_starts_on BETWEEN 0 AND 6),
    month_day INTEGER DEFAULT 1 CHECK (month_day BETWEEN 1 AND 28),
    allow_advance_payments BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- =====================================================
-- NUEVA TABLA: employee_loans
-- Préstamos y deducciones de empleados
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0,
    concept VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'frozen')),
    remaining_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_employee_loans_employee_id ON employee_loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_organization_id ON employee_loans(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_status ON employee_loans(status);

-- =====================================================
-- NUEVA TABLA: payroll_receipts
-- Recibos de nómina generados
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'biweekly', 'monthly', 'adhoc')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid')),
    gross_services_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    fixed_salary_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    loans_deducted NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_salary_separate BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_receipts_employee_id ON payroll_receipts(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_receipts_organization_id ON payroll_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_receipts_status ON payroll_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payroll_receipts_payment_date ON payroll_receipts(payment_date);

-- =====================================================
-- NUEVA TABLA: payroll_receipt_services
-- Detalle de servicios en cada recibo
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_receipt_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES payroll_receipts(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    service_name VARCHAR(255) NOT NULL,
    service_price NUMERIC(12,2) NOT NULL,
    commission_rate_applied NUMERIC(5,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_receipt_services_receipt_id ON payroll_receipt_services(receipt_id);

-- =====================================================
-- NUEVA TABLA: payroll_receipt_loans
-- Detalle de préstamos descontados en cada recibo
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_receipt_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES payroll_receipts(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES employee_loans(id),
    amount_deducted NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_receipt_loans_receipt_id ON payroll_receipt_loans(receipt_id);
CREATE INDEX IF NOT EXISTS idx_payroll_receipt_loans_loan_id ON payroll_receipt_loans(loan_id);

-- =====================================================
-- ACTUALIZAR SCHEMA.TYPES SUPABASE
-- =====================================================
-- NOTA: Después de ejecutar esta migración, regenera los tipos con:
-- supabase gen types typescript --project-id tu-project-id > types/supabase.ts
