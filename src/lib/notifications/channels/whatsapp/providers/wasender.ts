import type { SendResult, QueueItemStatus } from '@/types/notifications'
import type { WhatsAppProvider, ParsedWebhook, WhatsAppSendParams } from './types'
import { redactHeaders, truncatePayload, classifyProviderError } from '@/lib/notifications/redact-secrets'

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

    const url = `${this.baseUrl}/message/sendText/${this.instanceId}`
    const httpRequest = {
      url,
      method: 'POST' as const,
      headers: redactHeaders(headers),
      body: truncatePayload(payload),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    const startedAt = Date.now()

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const durationMs = Date.now() - startedAt
      const httpStatus = response.status

      let rawResponse: unknown
      try {
        rawResponse = await response.json()
      } catch {
        rawResponse = await response.text()
      }

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => { responseHeaders[key] = value })

      if (!response.ok) {
        const errorText = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse)
        return {
          success: false,
          error: `Wasender error: ${httpStatus} - ${errorText}`,
          retryable: httpStatus >= 500 || httpStatus === 429,
          errorType: classifyProviderError(new Error(errorText), httpStatus),
          httpRequest,
          httpStatus,
          responseHeaders: redactHeaders(responseHeaders),
          rawResponse,
          durationMs,
          attemptNumber: params.attemptNumber,
        }
      }

      let providerMessageId: string | undefined
      if (rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)) {
        const data = rawResponse as Record<string, unknown>
        providerMessageId = String(data.id || data.messageId || (data.key as Record<string, unknown>)?.id || '')
      }

      return {
        success: true,
        providerMessageId,
        rawResponse,
        httpRequest,
        httpStatus,
        responseHeaders: redactHeaders(responseHeaders),
        durationMs,
        attemptNumber: params.attemptNumber,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      const durationMs = Date.now() - startedAt
      const err = error as Error
      const errorType = classifyProviderError(err)

      return {
        success: false,
        error: err.name === 'AbortError' ? 'Timeout enviando a Wasender (30s)' : err.message,
        retryable: true,
        errorType,
        httpRequest,
        rawResponse: err.message,
        durationMs,
        attemptNumber: params.attemptNumber,
      }
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