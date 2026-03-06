-- =========================================================================================
-- INITIAL SCHEMA MIGRATION: SaaS Scheduling Platform (Refined)
-- Applies Supabase Postgres Best Practices: RLS, UUIDs, Indexes, and Constraints.
-- =========================================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================
-- ENUMS
-- ==========================
CREATE TYPE role_type AS ENUM ('owner', 'admin', 'staff');
CREATE TYPE integration_status AS ENUM ('disabled', 'pending', 'active', 'suspended');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'unpaid');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'canceled', 'no_show');
CREATE TYPE message_status AS ENUM ('pending', 'processing', 'sent', 'failed');
CREATE TYPE log_level AS ENUM ('info', 'warn', 'error', 'critical');

-- ==========================
-- CORE TABLES
-- ==========================

-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members (RBAC)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Booking Settings
CREATE TABLE booking_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    slot_interval INT NOT NULL DEFAULT 30,
    buffer_minutes INT NOT NULL DEFAULT 0,
    max_days_ahead INT NOT NULL DEFAULT 60,
    min_notice_hours INT NOT NULL DEFAULT 24,
    timezone VARCHAR NOT NULL DEFAULT 'UTC',
    online_booking_enabled BOOLEAN NOT NULL DEFAULT true
);

-- Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL, -- e.g., 'whatsapp'
    status VARCHAR NOT NULL DEFAULT 'disabled',
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, type)
);

-- ==========================
-- BILLING TABLES
-- ==========================

-- Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    max_employees INT NOT NULL,
    max_services INT NOT NULL,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT false
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR NOT NULL DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================
-- BUSINESS OPERATIONS
-- ==========================

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ref constraint: employee's user_id must be an organization member
    -- While difficult to enforce cleanly with simple cross-table FKs, RLS will handle the security.
    -- Added a unique constraint to ensure a user is only one employee per org.
    UNIQUE(organization_id, user_id)
);

-- Employee Availability
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE(employee_id, day_of_week)
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    duration INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Services (Many-to-Many with Overrides)
CREATE TABLE employee_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    duration_override INT,
    price_override NUMERIC(10,2),
    UNIQUE(employee_id, service_id)
);

-- ==========================
-- BOOKINGS & CLIENTS
-- ==========================

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointment Services
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    UNIQUE(appointment_id, service_id)
);

-- ==========================
-- AUTOMATION & OBSERVABILITY
-- ==========================

-- WhatsApp Messages Queue
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    phone VARCHAR NOT NULL,
    template VARCHAR NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    level VARCHAR NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================
-- PERFORMANCE INDEXES (CRITICAL)
-- ==========================
-- Indexing Foreign Keys to prevent Seq Scans and improve JOIN/DELETE performance
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_integrations_org_id ON integrations(organization_id);
CREATE INDEX idx_employees_org_id ON employees(organization_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_services_org_id ON services(organization_id);
CREATE INDEX idx_employee_services_emp_id ON employee_services(employee_id);
CREATE INDEX idx_employee_services_srv_id ON employee_services(service_id);
CREATE INDEX idx_clients_org_id ON clients(organization_id);
CREATE INDEX idx_appointments_org_id ON appointments(organization_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX idx_whatsapp_messages_org_id ON whatsapp_messages(organization_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_system_logs_org_id ON system_logs(organization_id);
CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);

-- ==========================
-- ROW LEVEL SECURITY (RLS)
-- ==========================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Base RLS Policy Template (Example):
-- CREATE POLICY "Users can view their organization data" ON <table_name>
--   FOR SELECT USING (organization_id IN (
--     SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
--   ));

-- ==========================
-- AUTOMATION TRIGGER (NEW USER -> ORG)
-- ==========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- 1. Create Organization
    INSERT INTO public.organizations (name, slug)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
        COALESCE(NEW.raw_user_meta_data->>'slug', 'biz-' || extract(epoch from now())::text)
    ) RETURNING id INTO new_org_id;

    -- 2. Add Owner Member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');

    -- 3. Add default Booking Settings (Using ID directly as it's PK)
    INSERT INTO public.booking_settings (
        organization_id, slot_interval, buffer_minutes, max_days_ahead, min_notice_hours, timezone, online_booking_enabled
    ) VALUES (
        new_org_id, 30, 0, 60, 24, 'UTC', true
    );

    -- 4. Add disabled WhatsApp Integration
    INSERT INTO public.integrations (organization_id, type, status)
    VALUES (new_org_id, 'whatsapp', 'disabled');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
