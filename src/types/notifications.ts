export type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'in_app'

export type NotificationProviderType =
  | 'wasender'
  | 'n8n'
  | 'evolution'
  | 'meta'
  | 'twilio'
  | 'resend'
  | 'internal'

export type QueueItemStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'failed_permanently'
  | 'cancelled'

export type AutomationTrigger =
  | 'appointment_created'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'confirmation_requested'

export type TemplateType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'employee_invitation'
  | 'payroll_receipt'
  | 'confirmation_request'

export type ConfirmationTokenAction = 'confirm' | 'cancel' | 'reschedule'

export interface TemplateVariable {
  name: string
  description: string
  required: boolean
  example?: string
}

export interface StandardTemplateVariables {
  clientName: string
  appointmentDate: string
  appointmentTime: string
  businessName: string
  serviceName: string
  employeeName: string
  confirmationLink: string
  cancellationLink: string
  rescheduleLink: string
  businessPhone: string
  businessAddress: string
}

export interface NotificationMessage {
  channel: NotificationChannel
  toAddress: string
  subject?: string
  body: string
  templateId?: string
  appointmentId?: string
  organizationId: string
  idempotencyKey: string
  scheduledAt?: string
  variables?: Record<string, string>
  metadata?: Record<string, unknown>
}

export interface SendResult {
  success: boolean
  providerMessageId?: string
  error?: string
  retryable?: boolean
  rawResponse?: unknown
}

export interface NotificationChannelAdapter {
  send(message: NotificationMessage): Promise<SendResult>
  validateConfig?(config: Record<string, unknown>): Promise<{ valid: boolean; errors?: string[] }>
  getProviderName(): NotificationProviderType
}

export interface ConfirmationToken {
  id: string
  appointmentId: string
  organizationId: string
  token: string
  action: ConfirmationTokenAction
  expiresAt: string
  usedAt?: string
  invalidatedAt?: string
  invalidatedReason?: string
  createdAt: string
}

export interface NotificationQueueItem {
  id: string
  organizationId: string
  appointmentId?: string
  channel: NotificationChannel
  templateId?: string
  toAddress: string
  renderedBody?: string
  subject?: string
  variables: Record<string, string>
  status: QueueItemStatus
  idempotencyKey: string
  attempts: number
  maxAttempts: number
  lastError?: string
  nextRetryAt?: string
  providerMessageId?: string
  providerResponse?: Record<string, unknown>
  scheduledAt: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  traceId: string
  claimedAt?: string
  createdAt: string
}

export interface MessageTemplate {
  id: string
  organizationId?: string
  channel: NotificationChannel
  type: TemplateType
  name: string
  subject?: string
  body: string
  variables: TemplateVariable[]
  isDefault: boolean
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface AutomationRule {
  id: string
  organizationId: string
  triggerEvent: AutomationTrigger
  channel: NotificationChannel
  templateId?: string
  delayMinutes: number
  isEnabled: boolean
  conditions: Record<string, unknown>
  createdAt: string
}

export interface NotificationProvider {
  id: string
  organizationId: string
  channel: NotificationChannel
  provider: NotificationProviderType
  isEnabled: boolean
  config: Record<string, unknown>
  rateLimitPerMin: number
  rateLimitPerDay?: number
  createdAt: string
  updatedAt: string
}

export interface ProcessQueueResult {
  processed: number
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

export interface WebhookPayload {
  providerMessageId: string
  status: string
  channel: NotificationChannel
  error?: string
  timestamp: string
  rawPayload: Record<string, unknown>
}

export const STANDARD_VARIABLES: TemplateVariable[] = [
  { name: 'clientName', description: 'Nombre del cliente', required: true, example: 'María García' },
  { name: 'appointmentDate', description: 'Fecha de la cita', required: true, example: '14 de mayo de 2026' },
  { name: 'appointmentTime', description: 'Hora de la cita', required: true, example: '2:00 PM' },
  { name: 'businessName', description: 'Nombre del negocio', required: true, example: 'Spa Relax' },
  { name: 'serviceName', description: 'Nombre del servicio', required: false, example: 'Masaje Relajante' },
  { name: 'employeeName', description: 'Nombre del empleado', required: false, example: 'Carlos López' },
  { name: 'confirmationLink', description: 'Link para confirmar asistencia', required: true },
  { name: 'cancellationLink', description: 'Link para cancelar cita', required: false },
  { name: 'rescheduleLink', description: 'Link para reprogramar', required: false },
  { name: 'businessPhone', description: 'Teléfono del negocio', required: false, example: '+57 300 123 4567' },
  { name: 'businessAddress', description: 'Dirección del negocio', required: false, example: 'Calle 123 #45-67, Bogotá' },
]

export const IDEMPOTENCY_KEY_FORMAT = '${organizationId}_${appointmentId}_${channel}_${type}_${date}'

export const WHATSAPP_TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  appointment_confirmation: 'Confirmación de cita',
  appointment_reminder: 'Recordatorio',
  appointment_cancelled: 'Cancelación',
  appointment_completed: 'Completado',
  confirmation_request: 'Solicitud de confirmación',
  employee_invitation: '',
  payroll_receipt: '',
}

export const WHATSAPP_TEMPLATE_TYPES = (
  Object.keys(WHATSAPP_TEMPLATE_TYPE_LABELS) as TemplateType[]
)
  .filter((t) => WHATSAPP_TEMPLATE_TYPE_LABELS[t] !== '')
  .map((t) => ({
    value: t,
    label: WHATSAPP_TEMPLATE_TYPE_LABELS[t],
  }))

export function generateIdempotencyKey(
  organizationId: string,
  appointmentId: string | undefined,
  channel: NotificationChannel,
  type: TemplateType,
  scheduledFor: Date
): string {
  const dateStr = scheduledFor.toISOString().split('T')[0]
  const apptPart = appointmentId || 'no_appt'
  return `${organizationId}_${apptPart}_${channel}_${type}_${dateStr}`
}

export type NotificationEventType =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'REPLIED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DEAD_LETTERED'
  | 'REPLAYED'

export interface NotificationConversation {
  id: string
  organizationId: string
  channel: NotificationChannel
  clientPhone: string
  appointmentId?: string
  lastMessageId?: string
  status: 'active' | 'archived' | 'blocked'
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface NotificationMessageRecord {
  id: string
  conversationId?: string
  organizationId: string
  queueItemId?: string
  providerMessageId?: string
  direction: 'outbound' | 'inbound'
  channel: NotificationChannel
  payload: Record<string, unknown>
  status: string
  processingTimeMs?: number
  errorCode?: string
  errorMessage?: string
  traceId?: string
  createdAt: string
}

export interface NotificationInboundEvent {
  id: string
  organizationId?: string
  providerMessageId: string
  channel: NotificationChannel
  provider: NotificationProviderType
  fromPhone?: string
  rawPayload: Record<string, unknown>
  parsedAction?: string
  processed: boolean
  processedAt?: string
  processingTimeMs?: number
  errorMessage?: string
  traceId?: string
  createdAt: string
}

export interface DeadLetterNotification {
  id: string
  originalQueueId: string
  organizationId: string
  channel: NotificationChannel
  toAddress?: string
  renderedBody?: string
  subject?: string
  variables: Record<string, string>
  lastError?: string
  errorCode?: string
  attempts: number
  movedAt: string
  replayStatus: 'pending' | 'replayed' | 'discarded'
  replayedAt?: string
  traceId?: string
  metadata: Record<string, unknown>
}

export interface NotificationEvent {
  id: string
  organizationId: string
  queueItemId?: string
  messageId?: string
  conversationId?: string
  eventType: NotificationEventType
  metadata: Record<string, unknown>
  traceId?: string
  createdAt: string
}

export function mapProviderStatusToInternal(
  provider: NotificationProviderType,
  providerStatus: string
): { status: QueueItemStatus; retryable: boolean } {
  const statusMap: Record<string, { status: QueueItemStatus; retryable: boolean }> = {
    wasender: {
      sent: { status: 'sent', retryable: false },
      delivered: { status: 'delivered', retryable: false },
      read: { status: 'read', retryable: false },
      failed: { status: 'failed', retryable: true },
      invalid_number: { status: 'failed_permanently', retryable: false },
      blocked: { status: 'failed_permanently', retryable: false },
    },
    n8n: {
      sent: { status: 'sent', retryable: false },
      delivered: { status: 'delivered', retryable: false },
      read: { status: 'read', retryable: false },
      failed: { status: 'failed', retryable: true },
      invalid_number: { status: 'failed_permanently', retryable: false },
      blocked: { status: 'failed_permanently', retryable: false },
    },
    resend: {
      delivered: { status: 'delivered', retryable: false },
      queued: { status: 'processing', retryable: false },
      sent: { status: 'sent', retryable: false },
      bounced: { status: 'failed_permanently', retryable: false },
      complained: { status: 'failed_permanently', retryable: false },
    },
    meta: {
      sent: { status: 'sent', retryable: false },
      delivered: { status: 'delivered', retryable: false },
      read: { status: 'read', retryable: false },
      failed: { status: 'failed', retryable: true },
    },
  }

  const mapping = statusMap[provider]
  if (!mapping) {
    return { status: 'failed', retryable: true }
  }

  return mapping[providerStatus] || { status: 'failed', retryable: true }
}