-- Employee Invitations System
-- File: supabase/migrations/20260320000000_employee_invitations.sql

CREATE TABLE employee_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    email VARCHAR(255),
    token VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    resend_count INT NOT NULL DEFAULT 0,
    last_resend_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(organization_id, email, status)
);

CREATE INDEX idx_invitations_token ON employee_invitations(token);
CREATE INDEX idx_invitations_employee ON employee_invitations(employee_id);
CREATE INDEX idx_invitations_org_status ON employee_invitations(organization_id, status);

ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: owner/admin can manage invitations
CREATE POLICY "Owners can manage invitations" ON employee_invitations
    FOR ALL 
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Policy: public read for token verification (only pending and not expired)
CREATE POLICY "Anyone can verify token" ON employee_invitations
    FOR SELECT 
    USING (status = 'pending' AND expires_at > NOW());

-- Function to check rate limit for resending
CREATE OR REPLACE FUNCTION can_resend_invitation(p_invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_resend_count INT;
    v_last_resend TIMESTAMPTZ;
    v_resend_limit CONSTANT INT := 10;
    v_window_minutes CONSTANT INT := 60;
BEGIN
    SELECT resend_count, last_resend_at INTO v_resend_count, v_last_resend
    FROM employee_invitations
    WHERE id = p_invitation_id;

    IF v_last_resend IS NULL THEN
        RETURN TRUE;
    END IF;

    IF v_resend_count >= v_resend_limit THEN
        RETURN FALSE;
    END IF;

    IF NOW() - v_last_resend > (v_window_minutes || ' minutes')::INTERVAL THEN
        RETURN TRUE;
    END IF;

    RETURN v_resend_count < v_resend_limit;
END;
$$ LANGUAGE plpgsql;
