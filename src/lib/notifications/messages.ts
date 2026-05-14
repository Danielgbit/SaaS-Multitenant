import { createClient } from '@/lib/supabase/server'
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
}

export async function logOutboundMessage(params: LogOutboundParams): Promise<NotificationMessageRecord> {
  const supabase = await createClient()

  const insertData = {
    conversation_id: params.conversationId || null,
    organization_id: params.organizationId,
    queue_item_id: params.queueItemId || null,
    provider_message_id: params.providerMessageId || null,
    direction: 'outbound' as const,
    channel: params.channel,
    payload: params.payload,
    status: params.status,
    trace_id: params.traceId || null,
  }

  const { data, error } = await (supabase as any)
    .from('notification_messages')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[logOutboundMessage] error:', error)
    throw error
  }

  return data as unknown as NotificationMessageRecord
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
    trace_id: params.traceId || null,
  }

  const { data, error } = await (supabase as any)
    .from('notification_messages')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[logInboundMessage] error:', error)
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