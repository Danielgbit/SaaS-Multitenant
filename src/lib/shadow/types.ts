// Shadow Mode Phase 2A - Minimal Types

export type ShadowCommandType =
  | 'appointment:create'
  | 'appointment:reschedule'
  | 'appointment:cancel'
  | 'service:complete'
  | 'service:complete_manual'
  | 'payment:confirm'
  | 'price:adjust'
  | 'cron:overdue'
  | 'cron:auto_complete'

export type ShadowMode = 'observe_only' | 'dual_write' | 'soft_enforce'

export interface ShadowCommand<T = unknown> {
  command: ShadowCommandType
  shadowMode: ShadowMode
  appointmentId: string
  organizationId: string
  correlationId: string
  actorId: string
  actorRole: string
  timestamp: string
  payload: T
}

export interface ShadowSeed {
  appointmentId: string
  observedUpdatedAt: string
  initialStatus: string
  initialConfirmationStatus: string
  correlationId: string
}

export interface LegacyResult {
  success: boolean
  status?: string
  confirmation_status?: string
  price_adjustment?: number
  completed_at?: string
  completed_by?: string
  confirmed_at?: string
  confirmed_by?: string
  payment_method?: string
  cancelled_at?: string
  [key: string]: unknown
}

export interface OrchestratorResult {
  valid: boolean
  targetState: {
    status?: string
    confirmation_status?: string
  }
  expectedEvents: string[]
  reason?: string
}

export interface DriftDetail {
  field: string
  legacy: unknown
  orchestrator: unknown
}

export interface ShadowValidationInput {
  command: ShadowCommandType
  appointmentId: string
  organizationId: string
  correlationId: string
  actorId: string
  actorRole: string
  timestamp: string
  payload: Record<string, unknown>
}

export interface AppointmentSnapshot {
  id: string
  organization_id: string
  status: string
  confirmation_status: string
  employee_id: string
  client_id: string
  start_time: string
  end_time: string
  price_adjustment: number | null
  payment_method: string | null
  completed_at: string | null
  completed_by: string | null
  confirmed_at: string | null
  confirmed_by: string | null
  created_at: string
  appointment_services?: Array<{
    service_id: string
    price?: number
  }>
}
