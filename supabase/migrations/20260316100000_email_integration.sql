-- Email Integration Tables
-- Enables organizations to configure automated email reminders via Resend

-- Email settings per organization
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  reminder_hours_before INTEGER DEFAULT 24,
  send_confirmation BOOLEAN DEFAULT true,
  send_reminders BOOLEAN DEFAULT true,
  send_post_appointment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL DEFAULT 'confirmation',
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_logs_appointment ON email_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_client ON email_logs(client_id);

-- RLS Policies for email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email settings for their organization"
  ON email_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update email settings for their organization"
  ON email_settings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert email settings for their organization"
  ON email_settings FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email logs for their organization"
  ON email_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert email logs for their organization"
  ON email_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS email_settings_updated_at_trigger ON email_settings;
CREATE TRIGGER email_settings_updated_at_trigger
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();
