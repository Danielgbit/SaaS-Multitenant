import type { NotificationProviderType } from '@/types/notifications'
import { truncatePayload as truncate } from './redact-secrets'

const MAX_PAYLOAD_SIZE = 256 * 1024

function truncatePayload(payload: unknown): unknown {
  return truncate(payload, MAX_PAYLOAD_SIZE)
}

export interface NormalizedProviderResponse {
  providerMessageId?: string
  statusCode?: number
  success: boolean
  raw?: Record<string, unknown>
  error?: string
}

export interface NormalizedWebhook {
  providerMessageId: string
  status: string
  fromPhone?: string
  text?: string
  timestamp: string
  eventType?: string
  rawPayload: Record<string, unknown>
}

export function normalizeSendResponse(
  provider: NotificationProviderType,
  response: unknown
): NormalizedProviderResponse {
  const raw = response as Record<string, unknown> | null

  switch (provider) {
    case 'n8n': {
      if (!raw) return { success: false }
      return {
        providerMessageId: String(raw.message_id || raw.id || ''),
        statusCode: raw.status as number | undefined,
        success: true,
        raw: raw as Record<string, unknown>,
      }
    }

    case 'wasender': {
      if (!raw) return { success: false }
      const data = raw as Record<string, unknown>
      return {
        providerMessageId: String(data.id || data.messageId || (data.key as Record<string, unknown>)?.id || ''),
        statusCode: raw.status as number | undefined,
        success: true,
        raw: truncatePayload(raw) as Record<string, unknown>,
      }
    }

    case 'resend': {
      if (!raw) return { success: false }
      return {
        providerMessageId: String((raw as any)?.id || ''),
        statusCode: 200,
        success: true,
        raw: truncatePayload(raw) as Record<string, unknown>,
      }
    }

    default:
      return {
        success: raw ? true : false,
        raw: raw ? (truncatePayload(raw) as Record<string, unknown>) : undefined,
      }
  }
}

export function normalizeWebhook(
  provider: NotificationProviderType,
  payload: Record<string, unknown>
): NormalizedWebhook {
  switch (provider) {
    case 'wasender': {
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
          (messageKey as Record<string, unknown>)?.id || raw.id || raw.message_id || ''
        ),
        status: String(raw.status || raw.event || ''),
        fromPhone: String(
          (messageKey as Record<string, unknown>)?.remoteJid ||
          raw.from || raw.phone ||
          (conversationInfo?.id as string) || ''
        ).replace(/@.+$/, ''),
        text: extractedText,
        timestamp: String(raw.timestamp || raw.created_at || new Date().toISOString()),
        eventType: raw.event as string | undefined,
        rawPayload: truncatePayload(payload) as Record<string, unknown>,
      }
    }

    case 'n8n': {
      return {
        providerMessageId: String(payload.provider_message_id || payload.message_id || payload.id || ''),
        status: String(payload.status || ''),
        fromPhone: String(payload.from || payload.phone || payload.From || payload.Phone || '').replace(/@.+$/, ''),
        text: String(payload.text || payload.Body || payload.body || ''),
        timestamp: String(payload.timestamp || new Date().toISOString()),
        rawPayload: truncatePayload(payload) as Record<string, unknown>,
      }
    }

    default:
      return {
        providerMessageId: String(payload.provider_message_id || payload.id || ''),
        status: String(payload.status || ''),
        fromPhone: String(payload.from || payload.phone || ''),
        text: String(payload.text || payload.body || ''),
        timestamp: String(payload.timestamp || new Date().toISOString()),
        rawPayload: truncatePayload(payload) as Record<string, unknown>,
      }
  }
}

export function normalizeError(
  provider: NotificationProviderType,
  error: unknown
): { normalized: string; retryable: boolean; code?: string } {
  const message = error instanceof Error ? error.message : String(error || '')
  const lower = message.toLowerCase()

  if (lower.includes('timeout')) {
    return { normalized: 'timeout', retryable: true, code: 'TIMEOUT' }
  }

  if (lower.includes('429') || lower.includes('rate limit')) {
    return { normalized: 'rate_limited', retryable: true, code: 'RATE_LIMITED' }
  }

  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('api key')) {
    return { normalized: 'auth_error', retryable: false, code: 'AUTH_ERROR' }
  }

  if (lower.includes('invalid_number') || lower.includes('invalid number')) {
    return { normalized: 'invalid_number', retryable: false, code: 'INVALID_NUMBER' }
  }

  if (lower.includes('blocked')) {
    return { normalized: 'blocked', retryable: false, code: 'BLOCKED' }
  }

  if (lower.includes('500') || lower.includes('503') || lower.includes('502')) {
    return { normalized: 'provider_error', retryable: true, code: 'PROVIDER_ERROR' }
  }

  if (provider === 'n8n' && (lower.includes('n8n error: 4') || lower.includes('n8n error: 4'))) {
    return { normalized: 'client_error', retryable: false, code: 'CLIENT_ERROR_4XX' }
  }

  if (provider === 'resend') {
    if (lower.includes('invalid') || lower.includes('bounced')) {
      return { normalized: 'invalid_recipient', retryable: false, code: 'INVALID_RECIPIENT' }
    }
  }

  return { normalized: 'unknown', retryable: true, code: 'UNKNOWN' }
}
