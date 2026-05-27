import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type {
  NotificationMessageRecord,
  NotificationEvent,
  NotificationInboundEvent,
  NotificationQueueItem,
  NotificationChannel,
} from '@/types/notifications'
import { toCamelCase, toCamelCaseArray } from '@/lib/utils/transform'

export interface MessageInspectorData {
  message: NotificationMessageRecord | null
  queueItem: NotificationQueueItem | null
  events: NotificationEvent[]
  inboundEvents: NotificationInboundEvent[]
}

export interface SearchFilters {
  status?: string
  channel?: NotificationChannel
  provider?: string
}

export interface SearchResult {
  id: string
  type: 'message' | 'queue'
  createdAt: string
  channel: string
  status: string
  providerMessageId?: string
  toAddress?: string
  bodyPreview?: string
  appointmentId?: string
  traceId?: string
  correlationId?: string
  queueItemId?: string
  providerSnapshot?: Record<string, unknown>
}

const MIN_QUERY_LENGTH = 3
const SEARCH_HARDCAP = 100

export async function getMessageInspectorData(
  messageId: string,
  organizationId: string
): Promise<MessageInspectorData> {
  const supabase = await createClient()

  const { data: message } = await (supabase as any)
    .from('notification_messages')
    .select('*')
    .eq('id', messageId)
    .eq('organization_id', organizationId)
    .single()

  const msg = message
    ? toCamelCase<NotificationMessageRecord>(message as Record<string, unknown>)
    : null

  let queueItem: NotificationQueueItem | null = null
  let events: NotificationEvent[] = []
  let inboundEvents: NotificationInboundEvent[] = []

  if (msg?.queueItemId) {
    const { data: qi } = await (supabase as any)
      .from('notification_queue')
      .select('*')
      .eq('id', msg.queueItemId)
      .single()
    queueItem = qi
      ? toCamelCase<NotificationQueueItem>(qi as Record<string, unknown>)
      : null

    const { data: evts } = await (supabase as any)
      .from('notification_events')
      .select('*')
      .eq('queue_item_id', msg.queueItemId)
      .order('created_at', { ascending: true })
    events = toCamelCaseArray<NotificationEvent>(evts as Record<string, unknown>[])
  }

  if (msg?.providerMessageId) {
    const { data: inbound } = await (supabase as any)
      .from('notification_inbound_events')
      .select('*')
      .eq('provider_message_id', msg.providerMessageId)
      .order('created_at', { ascending: false })
    inboundEvents = toCamelCaseArray<NotificationInboundEvent>(inbound as Record<string, unknown>[])
  }

  if (queueItem?.providerMessageId && queueItem.providerMessageId !== msg?.providerMessageId) {
    const { data: inbound } = await (supabase as any)
      .from('notification_inbound_events')
      .select('*')
      .eq('provider_message_id', queueItem.providerMessageId)
      .order('created_at', { ascending: false })
    const existing = new Set(inboundEvents.map((e) => e.id))
    for (const ie of toCamelCaseArray<NotificationInboundEvent>(inbound as Record<string, unknown>[])) {
      if (!existing.has(ie.id)) inboundEvents.push(ie)
    }
    inboundEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return { message: msg, queueItem, events, inboundEvents }
}

export async function searchMessages(
  organizationId: string,
  query: string,
  filters: SearchFilters = {},
  options: { limit?: number; offset?: number } = {}
): Promise<{ results: SearchResult[]; total: number }> {
  if (query.length < MIN_QUERY_LENGTH) {
    return { results: [], total: 0 }
  }

  const supabase = await createClient()
  const limit = Math.min(options.limit || 50, SEARCH_HARDCAP)
  const offset = options.offset || 0

  const q = `%${query}%`

  let messageQuery = (supabase as any)
    .from('notification_messages')
    .select('id, created_at, channel, status, provider_message_id, payload, queue_item_id, trace_id, correlation_id, request_payload, error_message, processing_time_ms')
    .eq('organization_id', organizationId)

  const orConditions = [
    `provider_message_id.ilike.${q}`,
    `trace_id.eq.${query}`,
    `correlation_id.ilike.${q}`,
  ]

  if (isUUID(query)) {
    orConditions.push(`id.eq.${query}`)
    orConditions.push(`queue_item_id.eq.${query}`)
  }

  messageQuery = messageQuery.or(orConditions.join(','))

  if (filters.status) messageQuery = messageQuery.eq('status', filters.status)
  if (filters.channel) messageQuery = messageQuery.eq('channel', filters.channel)

  const { data: messages, count: messageCount } = await messageQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  let queueQuery = (supabase as any)
    .from('notification_queue')
    .select('id, created_at, channel, status, provider_message_id, to_address, rendered_body, appointment_id, trace_id, correlation_id, provider_snapshot')
    .eq('organization_id', organizationId)

  const queueOrConditions = [
    `to_address.ilike.${q}`,
    `appointment_id.eq.${query}`,
    `trace_id.eq.${query}`,
    `correlation_id.ilike.${q}`,
  ]

  if (isUUID(query)) {
    queueOrConditions.push(`id.eq.${query}`)
  }

  queueQuery = queueQuery.or(queueOrConditions.join(','))

  if (filters.status) queueQuery = queueQuery.eq('status', filters.status)
  if (filters.channel) queueQuery = queueQuery.eq('channel', filters.channel)

  const { data: queueItems } = await queueQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const seenIds = new Set<string>()
  const results: SearchResult[] = []

  for (const m of (messages || []) as Record<string, unknown>[]) {
    const payload = m.payload as Record<string, unknown> | undefined
    seenIds.add(m.id as string)
    results.push({
      id: m.id as string,
      type: 'message',
      createdAt: m.created_at as string,
      channel: m.channel as string,
      status: m.status as string,
      providerMessageId: m.provider_message_id as string | undefined,
      toAddress: payload?.to_address as string | undefined,
      bodyPreview: payload?.body
        ? String(payload.body).slice(0, 80)
        : m.request_payload
        ? JSON.stringify(m.request_payload).slice(0, 80)
        : undefined,
      traceId: m.trace_id as string | undefined,
      correlationId: m.correlation_id as string | undefined,
      queueItemId: m.queue_item_id as string | undefined,
    })
  }

  for (const qi of (queueItems || []) as Record<string, unknown>[]) {
    const queueId = qi.id as string
    if (seenIds.has(queueId)) continue
    seenIds.add(queueId)
    const snapshot = qi.provider_snapshot as Record<string, unknown> | undefined
    results.push({
      id: queueId,
      type: 'queue',
      createdAt: qi.created_at as string,
      channel: qi.channel as string,
      status: qi.status as string,
      providerMessageId: qi.provider_message_id as string | undefined,
      toAddress: qi.to_address as string | undefined,
      bodyPreview: qi.rendered_body
        ? String(qi.rendered_body).slice(0, 80)
        : undefined,
      appointmentId: qi.appointment_id as string | undefined,
      traceId: qi.trace_id as string | undefined,
      correlationId: qi.correlation_id as string | undefined,
      providerSnapshot: snapshot,
    })
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { results: results.slice(0, limit), total: results.length }
}

export async function getRetryHistory(
  queueItemId: string
): Promise<NotificationEvent[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_events')
    .select('*')
    .eq('queue_item_id', queueItemId)
    .in('event_type', ['PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTERED'])
    .order('created_at', { ascending: true })

  return toCamelCaseArray<NotificationEvent>(data as Record<string, unknown>[])
}

export async function getInboundEvents(
  providerMessageId: string
): Promise<NotificationInboundEvent[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_inbound_events')
    .select('*')
    .eq('provider_message_id', providerMessageId)
    .order('created_at', { ascending: false })

  return toCamelCaseArray<NotificationInboundEvent>(data as Record<string, unknown>[])
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}
