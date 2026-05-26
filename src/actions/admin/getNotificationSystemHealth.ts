import { createClient } from '@/lib/supabase/server'
import type { WorkerHealth, AlertEvent, HealthSummary } from '@/types/admin/notifications'

export async function getNotificationSystemHealth() {
  const supabase = await createClient()

  const [{ data: workers, error: workersError }, { data: alerts, error: alertsError }] = await Promise.all([
    supabase
      .from('notification_worker_heartbeats')
      .select('*')
      .order('worker_name'),

    supabase
      .from('notification_alert_events')
      .select('id, worker_name, level, code, message, created_at')
      .is('resolved_at', null)
      .order('level', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (workersError) throw workersError
  if (alertsError) throw alertsError

  const workersList = (workers || []) as WorkerHealth[]
  const alertsList = (alerts || []) as AlertEvent[]

  return {
    workers: workersList,
    alerts: alertsList,
    summary: {
      healthyWorkers: workersList.filter(w => w.status === 'healthy').length,
      warningWorkers: workersList.filter(w => w.status === 'warning').length,
      errorWorkers: workersList.filter(w => w.status === 'error').length,
      totalQueueDepth: workersList.reduce((sum, w) => sum + (w.queue_depth || 0), 0),
      totalDlqDepth: workersList.reduce((sum, w) => sum + (w.dlq_depth || 0), 0),
      activeAlerts: alertsList?.length || 0,
    } as HealthSummary,
  }
}
