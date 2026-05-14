import type { SendResult, QueueItemStatus } from '@/types/notifications'
import type { WhatsAppProvider, ParsedWebhook, WhatsAppSendParams } from './types'

export class N8NProvider implements WhatsAppProvider {
  readonly name = 'n8n'

  private webhookUrl: string
  private apiKey?: string

  constructor(config: Record<string, unknown>) {
    this.webhookUrl = String(config.webhook_url || config.webhookUrl || '')
    this.apiKey = config.api_key ? String(config.api_key) : undefined
  }

  async sendMessage(params: WhatsAppSendParams): Promise<SendResult> {
    if (!this.webhookUrl) {
      return { success: false, error: 'N8N webhook URL no configurada', retryable: false }
    }

    const payload = {
      phone: params.to,
      message: params.body,
      variables: params.variables || {},
      appointment_id: params.appointmentId,
      message_type: 'notification',
      trace_id: params.traceId,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `N8N error: ${response.status} - ${errorText}`,
          retryable: response.status >= 500 || response.status === 429,
        }
      }

      let providerMessageId: string | undefined
      try {
        const data = await response.json() as Record<string, unknown>
        providerMessageId = String(data.message_id || data.id || '')
      } catch {
        providerMessageId = undefined
      }

      return { success: true, providerMessageId }
    } catch (error) {
      clearTimeout(timeoutId)
      const err = error as Error
      if (err.name === 'AbortError') {
        return { success: false, error: 'Timeout enviando a N8N (30s)', retryable: true }
      }
      return { success: false, error: err.message, retryable: true }
    }
  }

  async validateWebhook(request: Request, _body: string): Promise<boolean> {
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (!webhookSecret) return true

    const authHeader = request.headers.get('authorization')
    return authHeader === `Bearer ${webhookSecret}`
  }

  parseWebhook(payload: Record<string, unknown>): ParsedWebhook {
    return {
      providerMessageId: String(payload.provider_message_id || payload.message_id || payload.id || ''),
      status: String(payload.status || ''),
      fromPhone: String(payload.from || payload.phone || payload.From || payload.Phone || '').replace(/@.+$/, ''),
      text: String(payload.text || payload.Body || payload.body || ''),
      timestamp: String(payload.timestamp || new Date().toISOString()),
      rawPayload: payload,
    }
  }

  normalizeDeliveryStatus(providerStatus: string): { status: QueueItemStatus; retryable: boolean } {
    const map: Record<string, { status: QueueItemStatus; retryable: boolean }> = {
      sent: { status: 'sent', retryable: false },
      delivered: { status: 'delivered', retryable: false },
      read: { status: 'read', retryable: false },
      failed: { status: 'failed', retryable: true },
      invalid_number: { status: 'failed_permanently', retryable: false },
      blocked: { status: 'failed_permanently', retryable: false },
    }
    return map[providerStatus] || { status: 'failed', retryable: true }
  }
}