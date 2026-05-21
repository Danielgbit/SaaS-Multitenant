-- Remove CHECK constraint on notification_events.event_type
-- Validation is handled at the app layer (TypeScript NotificationEventType)
-- This avoids future migrations when new event types are added

ALTER TABLE notification_events
  DROP CONSTRAINT IF EXISTS notification_events_event_type_check;

-- Make organization_id nullable for webhook events logged before org resolution
ALTER TABLE notification_events
  ALTER COLUMN organization_id DROP NOT NULL;
