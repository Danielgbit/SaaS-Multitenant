-- =====================================================
-- NOTIFICATION ALERT EVENTS + EVALUATOR
-- Fecha: 2026-05-27
-- Descripción:
--   Historial de alertas del pipeline de notificaciones
--   Evaluador automático basado en worker heartbeats
-- =====================================================

-- =====================================================
-- 1. Tabla: notification_alert_events
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    worker_name TEXT NOT NULL
        REFERENCES notification_worker_heartbeats(worker_name),

    level TEXT NOT NULL
        CHECK (level IN ('warning', 'error')),

    code TEXT NOT NULL,
    message TEXT NOT NULL,

    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_events_worker
    ON notification_alert_events(worker_name);

CREATE INDEX IF NOT EXISTS idx_alert_events_level
    ON notification_alert_events(level);

CREATE INDEX IF NOT EXISTS idx_alert_events_unresolved
    ON notification_alert_events(worker_name)
    WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_alert_events_created
    ON notification_alert_events(created_at DESC);

COMMENT ON TABLE notification_alert_events IS
    'Alertas del pipeline de notificaciones. Generadas por evaluate_worker_alerts().';
COMMENT ON COLUMN notification_alert_events.code IS
    'worker_stale | queue_backlog | dlq_backlog | error_rate | provider_timeout';

-- =====================================================
-- 2. Evaluador: evaluate_worker_alerts()
--    Analiza heartbeats y crea alertas si thresholds
--    se superan. Idempotente: no duplica alertas activas.
-- =====================================================
CREATE OR REPLACE FUNCTION evaluate_worker_alerts()
RETURNS TABLE (
    alert_level TEXT,
    alert_code TEXT,
    alert_message TEXT,
    worker_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_worker RECORD;
    v_min_since_seen INT;
    v_error_rate NUMERIC;
    v_gap INT;
BEGIN
    FOR v_worker IN
        SELECT * FROM notification_worker_heartbeats
    LOOP
        v_min_since_seen := EXTRACT(EPOCH FROM v_now - v_worker.last_seen_at)::INT / 60;
        v_error_rate := CASE
            WHEN v_worker.processed_count > 0
            THEN (v_worker.error_count::NUMERIC / v_worker.processed_count::NUMERIC) * 100
            ELSE 0
        END;

        -- A. Worker stale: no heartbeat reciente
        IF v_min_since_seen > 5 THEN
            alert_level := 'error';
            alert_code := 'worker_stale';
            alert_message := format(
                'Worker %s no reporta hace %s minutos (último: %s)',
                v_worker.worker_name, v_min_since_seen, v_worker.last_seen_at
            );
            worker_name := v_worker.worker_name;

            -- No duplicar alerta activa del mismo código para el mismo worker
            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE worker_name = v_worker.worker_name
                AND code = 'worker_stale'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'error', 'worker_stale', alert_message);
            END IF;

            RETURN NEXT;
        ELSIF v_min_since_seen > 2 THEN
            alert_level := 'warning';
            alert_code := 'worker_stale';
            alert_message := format(
                'Worker %s sin heartbeat hace %s minutos',
                v_worker.worker_name, v_min_since_seen
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE worker_name = v_worker.worker_name
                AND code = 'worker_stale'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'warning', 'worker_stale', alert_message);
            END IF;

            RETURN NEXT;
        END IF;

        -- B. Queue backlog
        IF v_worker.queue_depth > 200 THEN
            alert_level := 'error';
            alert_code := 'queue_backlog';
            alert_message := format(
                'Cola de %s tiene %s items pendientes',
                v_worker.worker_name, v_worker.queue_depth
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE worker_name = v_worker.worker_name
                AND code = 'queue_backlog'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'error', 'queue_backlog', alert_message);
            END IF;

            RETURN NEXT;
        ELSIF v_worker.queue_depth > 50 THEN
            alert_level := 'warning';
            alert_code := 'queue_backlog';
            alert_message := format(
                'Cola de %s tiene %s items pendientes',
                v_worker.worker_name, v_worker.queue_depth
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE worker_name = v_worker.worker_name
                AND code = 'queue_backlog'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'warning', 'queue_backlog', alert_message);
            END IF;

            RETURN NEXT;
        END IF;

        -- C. DLQ backlog
        IF v_worker.dlq_depth > 20 THEN
            alert_level := 'error';
            alert_code := 'dlq_backlog';
            alert_message := format(
                'Dead Letter Queue tiene %s items sin procesar', v_worker.dlq_depth
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE code = 'dlq_backlog'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'error', 'dlq_backlog', alert_message);
            END IF;

            RETURN NEXT;
        ELSIF v_worker.dlq_depth > 5 THEN
            alert_level := 'warning';
            alert_code := 'dlq_backlog';
            alert_message := format(
                'Dead Letter Queue tiene %s items', v_worker.dlq_depth
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE code = 'dlq_backlog'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'warning', 'dlq_backlog', alert_message);
            END IF;

            RETURN NEXT;
        END IF;

        -- D. Error rate alto
        IF v_worker.processed_count >= 10 AND v_error_rate > 15 THEN
            alert_level := 'error';
            alert_code := 'error_rate';
            alert_message := format(
                'Worker %s tiene %.1f%% de error (%s errores en %s procesados)',
                v_worker.worker_name, v_error_rate, v_worker.error_count, v_worker.processed_count
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE worker_name = v_worker.worker_name
                AND code = 'error_rate'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'error', 'error_rate', alert_message);
            END IF;

            RETURN NEXT;
        ELSIF v_worker.processed_count >= 10 AND v_error_rate > 5 THEN
            alert_level := 'warning';
            alert_code := 'error_rate';
            alert_message := format(
                'Worker %s tiene %.1f%% de error (%s errores en %s procesados)',
                v_worker.worker_name, v_error_rate, v_worker.error_count, v_worker.processed_count
            );
            worker_name := v_worker.worker_name;

            IF NOT EXISTS (
                SELECT 1 FROM notification_alert_events
                WHERE worker_name = v_worker.worker_name
                AND code = 'error_rate'
                AND resolved = false
            ) THEN
                INSERT INTO notification_alert_events
                    (worker_name, level, code, message)
                VALUES (v_worker.worker_name, 'warning', 'error_rate', alert_message);
            END IF;

            RETURN NEXT;
        END IF;

        -- E. Provider latency alta (solo para provider-* workers)
        IF v_worker.worker_name LIKE 'provider-%' AND v_worker.last_latency_ms IS NOT NULL THEN
            IF v_worker.last_latency_ms > 10000 THEN
                alert_level := 'error';
                alert_code := 'provider_timeout';
                alert_message := format(
                    'Provider %s tiene latencia de %s ms',
                    v_worker.worker_name, v_worker.last_latency_ms
                );
                worker_name := v_worker.worker_name;

                IF NOT EXISTS (
                    SELECT 1 FROM notification_alert_events
                    WHERE worker_name = v_worker.worker_name
                    AND code = 'provider_timeout'
                    AND resolved = false
                ) THEN
                    INSERT INTO notification_alert_events
                        (worker_name, level, code, message)
                    VALUES (v_worker.worker_name, 'error', 'provider_timeout', alert_message);
                END IF;

                RETURN NEXT;
            ELSIF v_worker.last_latency_ms > 3000 THEN
                alert_level := 'warning';
                alert_code := 'provider_timeout';
                alert_message := format(
                    'Provider %s tiene latencia de %s ms',
                    v_worker.worker_name, v_worker.last_latency_ms
                );
                worker_name := v_worker.worker_name;

                IF NOT EXISTS (
                    SELECT 1 FROM notification_alert_events
                    WHERE worker_name = v_worker.worker_name
                    AND code = 'provider_timeout'
                    AND resolved = false
                ) THEN
                    INSERT INTO notification_alert_events
                        (worker_name, level, code, message)
                    VALUES (v_worker.worker_name, 'warning', 'provider_timeout', alert_message);
                END IF;

                RETURN NEXT;
            END IF;

            -- Si la latencia mejoró, resolver alertas previas
            IF v_worker.last_latency_ms <= 3000 THEN
                UPDATE notification_alert_events
                SET resolved = true, resolved_at = v_now
                WHERE worker_name = v_worker.worker_name
                AND code = 'provider_timeout'
                AND resolved = false;
            END IF;
        END IF;

        -- Resolver worker_stale si el worker volvió a reportar
        IF v_worker.status IN ('healthy', 'warning') AND v_min_since_seen <= 2 THEN
            UPDATE notification_alert_events
            SET resolved = true, resolved_at = v_now
            WHERE worker_name = v_worker.worker_name
            AND code = 'worker_stale'
            AND resolved = false;
        END IF;
    END LOOP;

    RETURN;
END;
$$;

COMMENT ON FUNCTION evaluate_worker_alerts IS
    'Evalúa heartbeats y genera alertas. Idempotente: upsert por worker + code no resuelto.';

GRANT EXECUTE ON FUNCTION evaluate_worker_alerts TO service_role;
