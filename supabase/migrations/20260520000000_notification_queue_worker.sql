-- Migration: notification_queue_worker
-- Adds: provider_snapshot, claim_notification_batch RPC, debugging columns, stuck job index
-- Date: 2026-05-20

-- ============================================================
-- 1. provider_snapshot — Snapshot del provider al encolar
-- ============================================================
ALTER TABLE notification_queue
ADD COLUMN IF NOT EXISTS provider_snapshot JSONB;

COMMENT ON COLUMN notification_queue.provider_snapshot IS
  'Snapshot del provider al encolar: {providerId, provider, channel}. Para replay determinístico.';

-- ============================================================
-- 2. Debugging columns para workers distribuidos
-- ============================================================
ALTER TABLE notification_queue
ADD COLUMN IF NOT EXISTS last_claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claimed_by VARCHAR(36),
ADD COLUMN IF NOT EXISTS worker_version VARCHAR(20) DEFAULT 'v2';

-- ============================================================
-- 3. Índice para recovery de stuck jobs
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notification_queue_stuck
  ON notification_queue(processing_timeout_at)
  WHERE status = 'processing';

-- ============================================================
-- 4. RPC: claim_notification_batch
-- Claim atómico con FOR UPDATE SKIP LOCKED + recovery de workers muertos
-- ============================================================
CREATE OR REPLACE FUNCTION claim_notification_batch(
  batch_size INTEGER DEFAULT 50,
  worker_id VARCHAR(36) DEFAULT gen_random_uuid()::text,
  worker_ver VARCHAR(20) DEFAULT 'v2'
) RETURNS SETOF notification_queue AS $$
  UPDATE notification_queue
  SET status = 'processing',
      claimed_at = NOW(),
      last_claimed_at = NOW(),
      claimed_by = worker_id,
      worker_version = worker_ver,
      processing_timeout_at = NOW() + INTERVAL '10 minutes'
  WHERE id IN (
    SELECT id FROM notification_queue
    WHERE (
      (status = 'pending' AND scheduled_at <= NOW())
      OR
      (status = 'processing' AND processing_timeout_at < NOW())
    )
    ORDER BY scheduled_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE SQL;

-- ROLLBACK:
-- DROP FUNCTION IF EXISTS claim_notification_batch;
-- DROP INDEX IF EXISTS idx_notification_queue_stuck;
-- ALTER TABLE notification_queue DROP COLUMN IF EXISTS provider_snapshot;
-- ALTER TABLE notification_queue DROP COLUMN IF EXISTS last_claimed_at;
-- ALTER TABLE notification_queue DROP COLUMN IF EXISTS claimed_by;
-- ALTER TABLE notification_queue DROP COLUMN IF EXISTS worker_version;
