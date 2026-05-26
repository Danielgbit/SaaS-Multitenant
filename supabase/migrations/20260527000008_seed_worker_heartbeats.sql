-- =====================================================
-- SEED WORKER HEARTBEATS
-- Fecha: 2026-05-27
-- Descripción:
--   Agrega workers faltantes al seed de heartbeats
--   cron-reminders ya envía heartbeats pero no estaba
--   en el seed inicial. cron-shadow y cron-purge se
--   agregan para el nuevo monitoreo.
-- =====================================================

INSERT INTO notification_worker_heartbeats (worker_name, status) VALUES
    ('cron-reminders', 'healthy'),
    ('cron-shadow', 'healthy'),
    ('cron-purge', 'healthy')
ON CONFLICT (worker_name) DO NOTHING;
