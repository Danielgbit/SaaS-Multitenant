-- Index for dashboard time-series queries (global aggregation)
-- Supports QueueChart hourly aggregation without org filter

CREATE INDEX IF NOT EXISTS idx_events_created_at ON notification_events(created_at DESC);
