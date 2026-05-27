import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/notifications/logger'
import { getRequestId } from '@/lib/request-context'
import type { NotificationMessageRecord } from '@/types/notifications'

interface LogOutboundParams {
  conversationId?: string
  organizationId: string
  queueItemId?: string
  providerMessageId?: string
  direction: 'outbound'
  channel: string
  payload: Record<string, unknown>
  status: string
  traceId?: string
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  responseHeaders?: Record<string, unknown>
  responseStatus?: number
  durationMs?: number
  retryCount?: number
  normalizedPayload?: Record<string, unknown>
  correlationId?: string
  errorMessage?: string
  errorType?: string
  attemptNumber?: number
  providerName?: string
}

interface LogInboundParams {
  conversationId?: string
  organizationId: string
  providerMessageId?: string
  direction: 'inbound'
  channel: string
  fromPhone: string
  payload: Record<string, unknown>
  text?: string
  traceId?: string
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  responseHeaders?: Record<string, unknown>
  responseStatus?: number
  normalizedPayload?: Record<string, unknown>
  correlationId?: string
}

export async function logOutboundMessage(params: LogOutboundParams): Promise<NotificationMessageRecord> {
  const supabase = await createClient()

  if (params.providerMessageId) {
    const existing = await findMessageByProviderId(params.providerMessageId)
    if (existing) return existing
  }

  const insertData = {
    conversation_id: params.conversationId || null,
    organization_id: params.organizationId,
    queue_item_id: params.queueItemId || null,
    provider_message_id: params.providerMessageId || null,
    direction: 'outbound' as const,
    channel: params.channel,
    payload: params.payload,
    status: params.status,
    trace_id: params.traceId || getRequestId() || null,
    request_payload: params.requestPayload || null,
    response_payload: params.responsePayload || null,
    response_headers: params.responseHeaders || null,
    response_status: params.responseStatus || null,
  }

  const { data, error } = await (supabase as any)
    .from('notification_messages')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    logger.error('logOutboundMessage failed', { error, organizationId: params.organizationId, queueItemId: params.queueItemId })
    throw error
  }

  return data as unknown as NotificationMessageRecord
}

export async function logOutboundAttempt(params: {
  messageId: string
  attemptNumber: number
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  responseStatus?: number
  error?: string
  errorType?: string
  durationMs?: number
}): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('notification_messages')
    .update({
      retry_count: params.attemptNumber,
      request_payload: params.requestPayload || null,
      response_payload: params.responsePayload || null,
      response_status: params.responseStatus || null,
      error_message: params.error || null,
      error_type: params.errorType || null,
      processing_time_ms: params.durationMs || null,
    })
    .eq('id', params.messageId)
}

export async function logInboundMessage(params: LogInboundParams): Promise<NotificationMessageRecord> {
  const supabase = await createClient()

  const insertData = {
    conversation_id: params.conversationId || null,
    organization_id: params.organizationId,
    provider_message_id: params.providerMessageId || null,
    direction: 'inbound' as const,
    channel: params.channel,
    payload: { ...params.payload, text: params.text },
    status: 'received',
    trace_id: params.traceId || getRequestId() || null,
    request_payload: params.requestPayload || null,
    response_payload: params.responsePayload || null,
    response_headers: params.responseHeaders || null,
    response_status: params.responseStatus || null,
    normalized_payload: params.normalizedPayload || null,
    correlation_id: params.correlationId || null,
  }

  const { data, error } = await (supabase as any)
    .from('notification_messages')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    logger.error('logInboundMessage failed', { error, organizationId: params.organizationId, providerMessageId: params.providerMessageId })
    throw error
  }

  return data as unknown as NotificationMessageRecord
}

export async function updateMessageStatus(
  messageId: string,
  status: string,
  providerMessageId?: string
): Promise<void> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = { status }
  if (providerMessageId) updates.provider_message_id = providerMessageId

  await (supabase as any)
    .from('notification_messages')
    .update(updates)
    .eq('id', messageId)
}

export async function recordMessageError(
  messageId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('notification_messages')
    .update({
      status: 'error',
      error_code: errorCode,
      error_message: errorMessage,
    })
    .eq('id', messageId)
}

export async function findMessageByProviderId(
  providerMessageId: string
): Promise<NotificationMessageRecord | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_messages')
    .select('*')
    .eq('provider_message_id', providerMessageId)
    .single()

  return (data as unknown as NotificationMessageRecord) || null
}