-- =====================================================
-- Critical alert delivery tracking
-- Permite a processCriticalNotificationAlerts() marcar
-- qué canales ya entregaron cada alerta, de forma granular.
-- Fecha: 2026-05-27
-- =====================================================

-- 1. Columnas de delivery en alert_events
ALTER TABLE notification_alert_events
ADD COLUMN email_sent_at TIMESTAMPTZ,
ADD COLUMN in_app_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN notification_alert_events.email_sent_at IS
  'Momento en que se envió el email de alerta crítica';
COMMENT ON COLUMN notification_alert_events.in_app_sent_at IS
  'Momento en que se creó la notificación in-app';

-- 2. Agregar system_alert al CHECK de notifications
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check,
ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'reminder',
    'service_ready',
    'unmarked_alert',
    'auto_completed',
    'confirmation_sent',
    'system_alert'
  ));
