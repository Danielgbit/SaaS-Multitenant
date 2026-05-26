-- =====================================================
-- NOTIFICATION WORKER HEARTBEATS
-- Fecha: 2026-05-27
-- Descripción:
--   Monitoreo de workers del pipeline de notificaciones
--   Detecta fallos silenciosos de cron/providers
-- =====================================================

-- =====================================================
-- 1. Tabla: notification_worker_heartbeats
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_worker_heartbeats (
    worker_name TEXT PRIMARY KEY,

    status TEXT NOT NULL DEFAULT 'healthy'
        CHECK (status IN ('healthy', 'warning', 'error')),

    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_success_at TIMESTAMPTZ,

    processed_count BIGINT NOT NULL DEFAULT 0,
    success_count BIGINT NOT NULL DEFAULT 0,
    error_count BIGINT NOT NULL DEFAULT 0,

    queue_depth INTEGER NOT NULL DEFAULT 0,
    queue_depth_updated_at TIMESTAMPTZ,
    dlq_depth INTEGER NOT NULL DEFAULT 0,

    last_latency_ms INTEGER,

    last_error TEXT,
    last_error_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_worker_heartbeats IS
    'Heartbeat de workers del pipeline de notificaciones';

COMMENT ON COLUMN notification_worker_heartbeats.queue_depth IS
    'Snapshot actual de items pendientes en notification_queue';
COMMENT ON COLUMN notification_worker_heartbeats.queue_depth_updated_at IS
    'Timestamp del último snapshot de queue_depth (0 puede ser stale)';
COMMENT ON COLUMN notification_worker_heartbeats.dlq_depth IS
    'Snapshot actual de items en dead_letter_notifications';

-- =====================================================
-- 2. Índices
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_status
    ON notification_worker_heartbeats(status);

CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_last_seen
    ON notification_worker_heartbeats(last_seen_at);

-- =====================================================
-- 3. Helper: upsert_worker_heartbeat
--     - Delta-accumulate para contadores
--     - Snapshot reemplazo para queue_depth/dlq_depth
--     - Manejo automático de timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_worker_heartbeat(
    p_worker_name TEXT,
    p_status TEXT DEFAULT 'healthy',
    p_processed_count BIGINT DEFAULT 0,
    p_success_count BIGINT DEFAULT 0,
    p_error_count BIGINT DEFAULT 0,
    p_queue_depth INTEGER DEFAULT 0,
    p_dlq_depth INTEGER DEFAULT 0,
    p_last_latency_ms INTEGER DEFAULT NULL,
    p_last_error TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
BEGIN
    INSERT INTO notification_worker_heartbeats (
        worker_name, status, last_seen_at, last_success_at,
        processed_count, success_count, error_count,
        queue_depth, queue_depth_updated_at, dlq_depth,
        last_latency_ms, last_error, last_error_at,
        metadata, created_at, updated_at
    ) VALUES (
        p_worker_name, p_status, v_now,
        CASE WHEN p_status IN ('healthy', 'warning') THEN v_now ELSE NULL END,
        p_processed_count, p_success_count, p_error_count,
        p_queue_depth,
        CASE WHEN p_queue_depth >= 0 THEN v_now ELSE NULL END,
        p_dlq_depth,
        p_last_latency_ms,
        CASE WHEN p_last_error IS NOT NULL THEN p_last_error ELSE NULL END,
        CASE WHEN p_last_error IS NOT NULL THEN v_now ELSE NULL END,
        p_metadata, v_now, v_now
    )
    ON CONFLICT (worker_name) DO UPDATE SET
        status = p_status,
        last_seen_at = v_now,
        last_success_at = CASE
            WHEN p_status IN ('healthy', 'warning')
            THEN v_now
            ELSE notification_worker_heartbeats.last_success_at
        END,
        processed_count = notification_worker_heartbeats.processed_count + p_processed_count,
        success_count = notification_worker_heartbeats.success_count + p_success_count,
        error_count = notification_worker_heartbeats.error_count + p_error_count,
        queue_depth = p_queue_depth,
        queue_depth_updated_at = CASE
            WHEN p_queue_depth >= 0 THEN v_now
            ELSE notification_worker_heartbeats.queue_depth_updated_at
        END,
        dlq_depth = p_dlq_depth,
        last_latency_ms = COALESCE(p_last_latency_ms, notification_worker_heartbeats.last_latency_ms),
        last_error = CASE
            WHEN p_last_error IS NOT NULL THEN p_last_error
            ELSE notification_worker_heartbeats.last_error
        END,
        last_error_at = CASE
            WHEN p_last_error IS NOT NULL THEN v_now
            ELSE notification_worker_heartbeats.last_error_at
        END,
        metadata = CASE
            WHEN p_metadata IS NOT NULL AND p_metadata <> '{}'::JSONB
            THEN notification_worker_heartbeats.metadata || p_metadata
            ELSE notification_worker_heartbeats.metadata
        END,
        updated_at = v_now;
END;
$$;

COMMENT ON FUNCTION upsert_worker_heartbeat IS
    'Actualiza heartbeat de un worker. Contadores se acumulan (delta), snapshots se reemplazan.';

GRANT EXECUTE ON FUNCTION upsert_worker_heartbeat TO service_role;
GRANT EXECUTE ON FUNCTION upsert_worker_heartbeat TO authenticated;

-- =====================================================
-- 4. Seed inicial: workers conocidos
-- =====================================================
INSERT INTO notification_worker_heartbeats (worker_name, status) VALUES
    ('cron-dispatch', 'healthy'),
    ('provider-whatsapp', 'healthy'),
    ('provider-email', 'healthy'),
    ('provider-in-app', 'healthy'),
    ('dead-letter-replay', 'healthy')
ON CONFLICT (worker_name) DO NOTHING;
