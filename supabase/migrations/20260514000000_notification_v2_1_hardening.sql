-- Migration: notification_v2_1_hardening
-- Adds: conversation tracking, message tracking, inbound event pipeline, dead letter queue, event timeline
-- Date: 2026-05-14

-- ============================================================
-- 1. Extend notification_providers provider enum
-- ============================================================
ALTER TABLE notification_providers DROP CONSTRAINT IF EXISTS notification_providers_provider_check;
ALTER TABLE notification_providers ADD CONSTRAINT notification_providers_provider_check
  CHECK (provider IN (
    'wasender', 'n8n', 'evolution', 'meta', 'twilio', 'resend', 'internal'
  ));

-- ============================================================
-- 2. notification_conversations
-- Lightweight conversation tracking for reliable reply correlation
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  client_phone VARCHAR(30) NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  last_message_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'blocked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_org_phone
  ON notification_conversations(organization_id, client_phone)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_conv_org_id
  ON notification_conversations(organization_id);

CREATE INDEX IF NOT EXISTS idx_conv_appointment
  ON notification_conversations(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- ============================================================
-- 3. notification_messages
-- Outbound/inbound message history independent of queue
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES notification_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES notification_queue(id) ON DELETE SET NULL,
  provider_message_id VARCHAR(255),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  payload JSONB,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  processing_time_ms INTEGER,
  error_code VARCHAR(50),
  error_message TEXT,
  trace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_msg_provider_id
  ON notification_messages(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_msg_conversation
  ON notification_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_msg_queue_item
  ON notification_messages(queue_item_id)
  WHERE queue_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_msg_org_trace
  ON notification_messages(organization_id, trace_id)
  WHERE trace_id IS NOT NULL;

-- ============================================================
-- 4. notification_inbound_events
-- Idempotent inbound event pipeline; replay-safe
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_inbound_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  provider_message_id VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  provider VARCHAR(20) NOT NULL,
  from_phone VARCHAR(30),
  raw_payload JSONB NOT NULL,
  parsed_action VARCHAR(30),
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  error_message TEXT,
  trace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inbound_provider_msg
  ON notification_inbound_events(provider_message_id);

CREATE INDEX IF NOT EXISTS idx_inbound_pending
  ON notification_inbound_events(processed, created_at)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_inbound_org
  ON notification_inbound_events(organization_id)
  WHERE organization_id IS NOT NULL;

-- ============================================================
-- 5. dead_letter_notifications
-- Permanently failed notifications; replay support
-- ============================================================
CREATE TABLE IF NOT EXISTS dead_letter_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_queue_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  to_address VARCHAR(255),
  rendered_body TEXT,
  subject VARCHAR(255),
  variables JSONB,
  last_error TEXT,
  error_code VARCHAR(50),
  attempts INTEGER NOT NULL DEFAULT 0,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replay_status VARCHAR(20) DEFAULT 'pending'
    CHECK (replay_status IN ('pending', 'replayed', 'discarded')),
  replayed_at TIMESTAMPTZ,
  trace_id UUID,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_dlq_org
  ON dead_letter_notifications(organization_id);

CREATE INDEX IF NOT EXISTS idx_dlq_replay
  ON dead_letter_notifications(replay_status)
  WHERE replay_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_dlq_trace
  ON dead_letter_notifications(trace_id)
  WHERE trace_id IS NOT NULL;

-- ============================================================
-- 6. notification_events
-- Event timeline for observability and analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES notification_queue(id) ON DELETE CASCADE,
  message_id UUID REFERENCES notification_messages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES notification_conversations(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN (
      'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ',
      'REPLIED', 'CONFIRMED', 'FAILED', 'CANCELLED',
      'DEAD_LETTERED', 'REPLAYED'
    )),
  metadata JSONB DEFAULT '{}',
  trace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_queue
  ON notification_events(queue_item_id)
  WHERE queue_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_message
  ON notification_events(message_id)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_trace
  ON notification_events(trace_id)
  WHERE trace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_type
  ON notification_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_events_org_time
  ON notification_events(organization_id, created_at DESC);