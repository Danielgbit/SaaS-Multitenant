import type { SendResult, QueueItemStatus } from '@/types/notifications'
import type { WhatsAppProvider, ParsedWebhook, WhatsAppSendParams } from './types'

export class WasenderProvider implements WhatsAppProvider {
  readonly name = 'wasender'

  private baseUrl: string
  private apiKey: string
  private instanceId: string

  constructor(config: Record<string, unknown>) {
    this.baseUrl = String(config.base_url || config.baseUrl || '').replace(/\/$/, '')
    this.apiKey = String(config.api_key || config.apiKey || '')
    this.instanceId = String(config.instance_id || config.instanceId || '')
  }

  async sendMessage(params: WhatsAppSendParams): Promise<SendResult> {
    if (!this.baseUrl || !this.instanceId) {
      return { success: false, error: 'Wasender baseUrl/instanceId no configurados', retryable: false }
    }

    const payload = {
      number: params.to.replace(/\D/g, ''),
      text: params.body,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const url = `${this.baseUrl}/message/sendText/${this.instanceId}`
      const response = await fetch(url, {
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
          error: `Wasender error: ${response.status} - ${errorText}`,
          retryable: response.status >= 500 || response.status === 429,
        }
      }

      let providerMessageId: string | undefined
      try {
        const responseText = await response.text()
        const data = JSON.parse(responseText) as Record<string, unknown>
        providerMessageId = String(data.id || data.messageId || (data.key as Record<string, unknown>)?.id || '')
      } catch {
        providerMessageId = undefined
      }

      return { success: true, providerMessageId, rawResponse: { status: response.status } }
    } catch (error) {
      clearTimeout(timeoutId)
      const err = error as Error
      if (err.name === 'AbortError') {
        return { success: false, error: 'Timeout enviando a Wasender (30s)', retryable: true }
      }
      return { success: false, error: err.message, retryable: true }
    }
  }

  async validateWebhook(request: Request, _body: string): Promise<boolean> {
    const webhookToken = request.headers.get('x-wasender-token')
    const authToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

    const expectedToken = process.env.WASENDER_WEBHOOK_TOKEN
    if (!expectedToken) return true

    if (webhookToken && webhookToken === expectedToken) return true
    if (authToken && authToken === expectedToken) return true

    return false
  }

  parseWebhook(payload: Record<string, unknown>): ParsedWebhook {
    const raw = payload as Record<string, unknown>
    const messageKey = (raw.key || raw.message) as Record<string, unknown> | undefined
    const messageInfo = (raw.message || raw.key) as Record<string, unknown> | undefined
    const conversationInfo = (
      raw.conversation ||
      ((raw.conversations as unknown as Record<string, unknown>[]) || [])[0]
    ) as Record<string, unknown> | undefined

    let extractedText = ''
    if (messageInfo && typeof messageInfo === 'object') {
      const mi = messageInfo as Record<string, unknown>
      if (typeof mi.conversation === 'string') extractedText = mi.conversation
      else if (mi.extendedTextMessage && typeof mi.extendedTextMessage === 'object') {
        const em = mi.extendedTextMessage as Record<string, unknown>
        if (typeof em.text === 'string') extractedText = em.text
      }
    }
    if (!extractedText) {
      extractedText = (raw.text as string) || (raw.body as string) || ''
    }

    return {
      providerMessageId: String(
        (messageKey as Record<string, unknown>)?.id ||
        raw.id ||
        raw.message_id ||
        ''
      ),
      status: String(raw.status || raw.event || ''),
      fromPhone: String(
        (messageKey as Record<string, unknown>)?.remoteJid ||
        raw.from ||
        raw.phone ||
        conversationInfo?.id ||
        ''
      ).replace(/@.+$/, ''),
      text: extractedText,
      timestamp: String(
        raw.timestamp ||
        raw.created_at ||
        new Date().toISOString()
      ),
      rawPayload: payload,
    }
  }

  normalizeDeliveryStatus(providerStatus: string): { status: QueueItemStatus; retryable: boolean } {
    const map: Record<string, { status: QueueItemStatus; retryable: boolean }> = {
      sent: { status: 'sent', retryable: false },
      delivered: { status: 'delivered', retryable: false },
      read: { status: 'read', retryable: false },
      failed: { status: 'failed', retryable: true },
      pending: { status: 'processing', retryable: false },
      error: { status: 'failed_permanently', retryable: false },
      invalid_number: { status: 'failed_permanently', retryable: false },
      blocked: { status: 'failed_permanently', retryable: false },
    }
    return map[providerStatus] || { status: 'failed', retryable: true }
  }
}