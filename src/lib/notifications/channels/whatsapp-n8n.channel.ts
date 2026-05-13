import type {
  NotificationChannelAdapter,
  NotificationMessage,
  SendResult,
} from './types'
import type { NotificationChannel, NotificationProviderType } from '@/types/notifications'

export class N8NWhatsAppChannel implements NotificationChannelAdapter {
  private webhookUrl: string
  private apiKey?: string

  constructor(config: Record<string, unknown>) {
    this.webhookUrl = String(config.webhook_url || config.webhookUrl || '')
    this.apiKey = config.api_key ? String(config.api_key) : undefined
  }

  async send(message: NotificationMessage): Promise<SendResult> {
    if (!this.webhookUrl) {
      return { success: false, error: 'N8N webhook URL no configurada', retryable: false }
    }

    const payload = {
      phone: message.toAddress,
      message: message.body,
      variables: message.variables || {},
      appointment_id: message.appointmentId,
      message_type: 'notification',
      trace_id: message.metadata?.traceId as string || '',
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
        const data = await response.json()
        providerMessageId = data.message_id || data.id
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

  getProviderName(): NotificationProviderType {
    return 'n8n'
  }

  getChannel(): NotificationChannel {
    return 'whatsapp'
  }
}