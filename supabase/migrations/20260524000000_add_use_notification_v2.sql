-- Migration: Add use_notification_v2 flag to booking_settings
-- Allows per-organization control of V2 notification system
-- Date: 2026-05-24

ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS use_notification_v2 BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN booking_settings.use_notification_v2 IS
  'Per-org feature flag for V2 notification system. When true, uses notification_queue + worker.';

-- ROLLBACK:
-- ALTER TABLE booking_settings DROP COLUMN IF EXISTS use_notification_v2;
