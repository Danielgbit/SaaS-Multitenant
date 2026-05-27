import type { SendResult, QueueItemStatus } from '@/types/notifications'
import type { WhatsAppProvider, ParsedWebhook, WhatsAppSendParams } from './types'
import { redactHeaders, truncatePayload, classifyProviderError } from '@/lib/notifications/redact-secrets'
import { serverEnv } from '@/lib/env/server'

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

    const httpRequest = {
      url: this.webhookUrl,
      method: 'POST' as const,
      headers: redactHeaders(headers),
      body: truncatePayload(payload),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    const startedAt = Date.now()

    try {
      const response = await fetch(this.webhookUrl, {
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
          error: `N8N error: ${httpStatus} - ${errorText}`,
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
        providerMessageId = String((rawResponse as Record<string, unknown>).message_id || (rawResponse as Record<string, unknown>).id || '')
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
        error: err.name === 'AbortError' ? 'Timeout enviando a N8N (30s)' : err.message,
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
    const webhookSecret = serverEnv.WEBHOOK_SECRET
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