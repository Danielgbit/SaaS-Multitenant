export type WorkerHealth = {
  worker_name: string
  status: 'healthy' | 'warning' | 'error'
  last_seen_at: string
  processed_count: number
  success_count: number
  error_count: number
  queue_depth: number
  dlq_depth: number
  last_latency_ms: number | null
}

export type AlertEvent = {
  id: string
  worker_name: string
  level: 'warning' | 'error'
  code: string
  message: string
  created_at: string
}

export type HealthSummary = {
  healthyWorkers: number
  warningWorkers: number
  errorWorkers: number
  totalQueueDepth: number
  totalDlqDepth: number
  activeAlerts: number
}
