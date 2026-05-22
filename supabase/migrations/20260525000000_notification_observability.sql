-- Notification Observability & Correlation
-- Adds columns for full message inspection, latency tracking, and global correlation_id

-- ============================================================
-- notification_messages: request/response payloads + correlation
-- ============================================================
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS request_payload JSONB;
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS response_payload JSONB;
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS response_headers JSONB;
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS response_status INTEGER;
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS normalized_payload JSONB;
ALTER TABLE notification_messages ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON notification_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_org_created ON notification_messages(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_correlation ON notification_messages(correlation_id);
CREATE INDEX IF NOT EXISTS idx_messages_queue_item ON notification_messages(queue_item_id);

-- ============================================================
-- notification_queue: latency tracking + correlation
-- ============================================================
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_queue_correlation ON notification_queue(correlation_id);

-- ============================================================
-- notification_events: enriched metadata + correlation
-- ============================================================
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS worker_id VARCHAR(36);
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255);
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_events_correlation ON notification_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_provider_msg ON notification_events(provider_message_id);

-- ============================================================
-- notification_inbound_events: normalized + correlation
-- ============================================================
ALTER TABLE notification_inbound_events ADD COLUMN IF NOT EXISTS normalized_payload JSONB;
ALTER TABLE notification_inbound_events ADD COLUMN IF NOT EXISTS provider_headers JSONB;
ALTER TABLE notification_inbound_events ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);

-- ============================================================
-- dead_letter_notifications: correlation
-- ============================================================
ALTER TABLE dead_letter_notifications ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);
