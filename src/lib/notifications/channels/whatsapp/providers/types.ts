import type { SendResult, QueueItemStatus } from '@/types/notifications'

export interface WhatsAppSendParams {
  to: string
  body: string
  variables: Record<string, string>
  appointmentId?: string
  traceId: string
  attemptNumber?: number
}

export interface ParsedWebhook {
  providerMessageId: string
  status?: string
  fromPhone?: string
  text?: string
  timestamp: string
  rawPayload: Record<string, unknown>
}

export interface WhatsAppProvider {
  sendMessage(params: WhatsAppSendParams): Promise<SendResult>
  validateWebhook(request: Request, body: string): Promise<boolean>
  parseWebhook(payload: Record<string, unknown>): ParsedWebhook
  normalizeDeliveryStatus(providerStatus: string): { status: QueueItemStatus; retryable: boolean }
  readonly name: string
}