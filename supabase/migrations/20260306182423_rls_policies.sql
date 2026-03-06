-- =========================================================================================
-- RLS POLICIES MIGRATION
-- Applies Row Level Security to all tenant-specific tables based on organization_members.
-- =========================================================================================

-- ==========================================
-- 1. ORGANIZATION MEMBERS (The pivot table)
-- ==========================================
-- Users can read organization members if they belong to that organization, or if it's their own record.
CREATE POLICY "Users can access their organization members"
ON organization_members
FOR ALL
USING (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- ==========================================
-- 2. ORGANIZATIONS (Special case: checking id)
-- ==========================================
CREATE POLICY "Users can access their organizations"
ON organizations
FOR ALL
USING (
    id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- ==========================================
-- 3. STANDARD TENANT TABLES
-- ==========================================
-- Applies to: clients, employees, services, appointments, whatsapp_messages, 
-- integrations, system_logs, booking_settings, subscriptions.

-- CLIENTS
CREATE POLICY "Users can access clients in their organization"
ON clients FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- EMPLOYEES
CREATE POLICY "Users can access employees in their organization"
ON employees FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- SERVICES
CREATE POLICY "Users can access services in their organization"
ON services FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- APPOINTMENTS
CREATE POLICY "Users can access appointments in their organization"
ON appointments FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- WHATSAPP MESSAGES
CREATE POLICY "Users can access whatsapp_messages in their organization"
ON whatsapp_messages FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- INTEGRATIONS
CREATE POLICY "Users can access integrations in their organization"
ON integrations FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- SYSTEM LOGS
CREATE POLICY "Users can access system_logs in their organization"
ON system_logs FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- BOOKING SETTINGS
CREATE POLICY "Users can access booking_settings in their organization"
ON booking_settings FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );

-- SUBSCRIPTIONS
CREATE POLICY "Users can access subscriptions in their organization"
ON subscriptions FOR ALL 
USING ( organization_id IN ( SELECT organization_id FROM organization_members WHERE user_id = auth.uid() ) );


-- ==========================================
-- 4. TABLES WITHOUT DIRECT organization_id
-- (Using JOIN through parent tables)
-- ==========================================

-- EMPLOYEE AVAILABILITY
CREATE POLICY "Users can access availability through employees"
ON employee_availability FOR ALL
USING (
    employee_id IN (
        SELECT id FROM employees WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    )
);

-- EMPLOYEE SERVICES
CREATE POLICY "Users can access employee_services through employees"
ON employee_services FOR ALL
USING (
    employee_id IN (
        SELECT id FROM employees WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    )
);

-- APPOINTMENT SERVICES
CREATE POLICY "Users can access appointment_services through appointments"
ON appointment_services FOR ALL
USING (
    appointment_id IN (
        SELECT id FROM appointments WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    )
);

-- PLANS (Global configuration table)
CREATE POLICY "Anyone authenticated can read plans"
ON plans FOR SELECT
TO authenticated
USING (true);
