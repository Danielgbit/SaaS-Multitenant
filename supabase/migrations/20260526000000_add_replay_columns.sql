ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS replayed_from_queue_item_id UUID NULL;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS replay_reason TEXT NULL;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS manual_replay BOOLEAN DEFAULT false;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS replayed_by_user_id UUID NULL;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS replayed_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_queue_replayed_from ON notification_queue(replayed_from_queue_item_id);
