-- Sprint 2: Add error_type and attempt_number columns for provider response logging
ALTER TABLE notification_messages
ADD COLUMN IF NOT EXISTS error_type VARCHAR(30);

ALTER TABLE notification_messages
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 0;

ALTER TABLE notification_messages
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(20);

COMMENT ON COLUMN notification_messages.error_type IS 'Network-level classification: timeout, rate_limit, server_error, network, invalid_response, unknown';
COMMENT ON COLUMN notification_messages.attempt_number IS 'Which attempt this message represents (1-based)';
COMMENT ON COLUMN notification_messages.provider_name IS 'Provider name: n8n, wasender, resend, etc.';

-- ROLLBACK:
-- ALTER TABLE notification_messages DROP COLUMN IF EXISTS error_type;
-- ALTER TABLE notification_messages DROP COLUMN IF EXISTS attempt_number;
-- ALTER TABLE notification_messages DROP COLUMN IF EXISTS provider_name;
