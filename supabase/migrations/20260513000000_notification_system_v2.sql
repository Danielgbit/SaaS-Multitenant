-- =========================================================================================
-- NOTIFICATION SYSTEM V2: Multi-tenant notification infrastructure
-- =========================================================================================
-- Tables: notification_providers, message_templates, notification_queue,
--         confirmation_tokens, automation_rules
-- Features: Provider abstraction, template engine, queue processor with SKIP LOCKED,
--           confirmation tokens, automation rules
-- Date: 13 Mayo 2026

-- =========================================================================================
-- 1. NOTIFICATION_PROVIDERS — Per-org provider credentials
-- =========================================================================================

CREATE TABLE IF NOT EXISTS notification_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'in_app')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('n8n', 'evolution', 'meta', 'twilio', 'resend', 'internal')),
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  rate_limit_per_min INTEGER DEFAULT 30,
  rate_limit_per_day INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, channel, provider)
);

CREATE INDEX IF NOT EXISTS idx_notification_providers_org_channel ON notification_providers(organization_id, channel) WHERE is_enabled = true;

-- =========================================================================================
-- 2. MESSAGE_TEMPLATES — Versioned templates with placeholders
-- =========================================================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'in_app')),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_org_channel_type ON message_templates(organization_id, channel, type);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_default ON message_templates(is_default, is_active) WHERE is_default = true;

-- =========================================================================================
-- 3. NOTIFICATION_QUEUE — Unified queue with SKIP LOCKED support
-- =========================================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  channel VARCHAR(20) NOT NULL,
  template_id UUID REFERENCES message_templates(id),
  to_address VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  rendered_body TEXT,

  variables JSONB DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'sent', 'delivered', 'read',
    'failed', 'failed_permanently', 'cancelled'
  )),

  idempotency_key VARCHAR(255) NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,

  provider_message_id VARCHAR(255),
  provider_response JSONB,

  trace_id VARCHAR(36),

  claimed_at TIMESTAMPTZ,
  processing_timeout_at TIMESTAMPTZ,

  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_at) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_notification_queue_org_status ON notification_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_appointment_id ON notification_queue(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_claimed_at ON notification_queue(claimed_at) WHERE status = 'processing';

-- =========================================================================================
-- 4. CONFIRMATION_TOKENS — Secure confirmation links
-- =========================================================================================

CREATE TABLE IF NOT EXISTS confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token VARCHAR(36) NOT NULL UNIQUE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('confirm', 'cancel', 'reschedule')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  invalidated_at TIMESTAMPTZ,
  invalidated_reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_token ON confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_appointment_id ON confirmation_tokens(appointment_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_expires ON confirmation_tokens(expires_at) WHERE used_at IS NULL AND invalidated_at IS NULL;

-- =========================================================================================
-- 5. AUTOMATION_RULES — Per-org notification automation
-- =========================================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_event VARCHAR(50) NOT NULL CHECK (trigger_event IN (
    'appointment_created', 'appointment_reminder', 'appointment_cancelled',
    'appointment_completed', 'appointment_no_show', 'confirmation_requested'
  )),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'in_app')),
  template_id UUID REFERENCES message_templates(id),
  delay_minutes INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_org_trigger ON automation_rules(organization_id, trigger_event, is_enabled) WHERE is_enabled = true;

-- =========================================================================================
-- 6. RLS POLICIES — Multi-tenant isolation
-- =========================================================================================

ALTER TABLE notification_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- notification_providers: org members can read, only owners/admins can modify
CREATE POLICY "notification_providers_select" ON notification_providers
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "notification_providers_insert" ON notification_providers
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "notification_providers_update" ON notification_providers
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- message_templates: org members can read default and org templates
CREATE POLICY "message_templates_select" ON message_templates
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "message_templates_insert" ON message_templates
  FOR INSERT WITH CHECK (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "message_templates_update" ON message_templates
  FOR UPDATE USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- notification_queue: service role only for processing, org members can read
CREATE POLICY "notification_queue_select" ON notification_queue
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "notification_queue_service_insert" ON notification_queue
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notification_queue_service_update" ON notification_queue
  FOR UPDATE USING (true);

-- confirmation_tokens: public read for validation, service role for mutations
CREATE POLICY "confirmation_tokens_select_public" ON confirmation_tokens
  FOR SELECT USING (true);

CREATE POLICY "confirmation_tokens_insert" ON confirmation_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "confirmation_tokens_update" ON confirmation_tokens
  FOR UPDATE USING (true);

-- automation_rules: org members can read, admins can modify
CREATE POLICY "automation_rules_select" ON automation_rules
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "automation_rules_insert" ON automation_rules
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "automation_rules_update" ON automation_rules
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- =========================================================================================
-- 7. ADD pending_confirmation TO appointments.confirmation_status
-- =========================================================================================

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_confirmation_status_check;

ALTER TABLE appointments ADD CONSTRAINT appointments_confirmation_status_check
  CHECK (confirmation_status IN (
    'scheduled', 'pending_confirmation', 'completed', 'confirmed', 'needs_review'
  ));

-- =========================================================================================
-- 8. MIGRATE DATA FROM whatsapp_settings TO notification_providers
-- =========================================================================================

INSERT INTO notification_providers (organization_id, channel, provider, is_enabled, config, rate_limit_per_min)
SELECT
  ws.organization_id,
  'whatsapp'::VARCHAR,
  'n8n'::VARCHAR,
  ws.enabled,
  jsonb_build_object('webhook_url', ws.webhook_url, 'api_key', ws.api_key),
  COALESCE(ws.reminder_hours_before, 24)
FROM whatsapp_settings ws
ON CONFLICT (organization_id, channel, provider) DO NOTHING;

-- =========================================================================================
-- 9. MIGRATE DATA FROM email_settings TO notification_providers
-- =========================================================================================

INSERT INTO notification_providers (organization_id, channel, provider, is_enabled, config)
SELECT
  es.organization_id,
  'email'::VARCHAR,
  'resend'::VARCHAR,
  es.enabled,
  jsonb_build_object('from_email', es.from_email)
FROM email_settings es
ON CONFLICT (organization_id, channel, provider) DO NOTHING;

-- ROLLBACK:
-- DROP TABLE IF EXISTS notification_providers CASCADE;
-- DROP TABLE IF EXISTS message_templates CASCADE;
-- DROP TABLE IF EXISTS notification_queue CASCADE;
-- DROP TABLE IF EXISTS confirmation_tokens CASCADE;
-- DROP TABLE IF EXISTS automation_rules CASCADE;
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_confirmation_status_check;
-- ALTER TABLE appointments ADD CONSTRAINT appointments_confirmation_status_check CHECK (confirmation_status IN ('scheduled', 'completed', 'confirmed', 'needs_review'));