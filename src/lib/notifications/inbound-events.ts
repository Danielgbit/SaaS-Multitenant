import { createClient } from '@/lib/supabase/server'
import type { NotificationInboundEvent, NotificationProviderType } from '@/types/notifications'
import { randomUUID } from 'crypto'

interface RecordInboundParams {
  organizationId?: string
  providerMessageId: string
  channel: string
  provider: NotificationProviderType
  fromPhone?: string
  rawPayload: Record<string, unknown>
  parsedAction?: string
  traceId?: string
}

interface RecordResult {
  event: NotificationInboundEvent
  created: boolean
}

export async function recordInboundEvent(params: RecordInboundParams): Promise<RecordResult> {
  const supabase = await createClient()

  const { data: existing } = await (supabase as any)
    .from('notification_inbound_events')
    .select('*')
    .eq('provider_message_id', params.providerMessageId)
    .single()

  if (existing) {
    return { event: existing as unknown as NotificationInboundEvent, created: false }
  }

  const traceId = params.traceId || randomUUID()

  const { data, error } = await (supabase as any)
    .from('notification_inbound_events')
    .insert({
      organization_id: params.organizationId || null,
      provider_message_id: params.providerMessageId,
      channel: params.channel,
      provider: params.provider,
      from_phone: params.fromPhone || null,
      raw_payload: params.rawPayload,
      parsed_action: params.parsedAction || null,
      processed: false,
      trace_id: traceId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: retry } = await (supabase as any)
        .from('notification_inbound_events')
        .select('*')
        .eq('provider_message_id', params.providerMessageId)
        .single()
      return { event: retry as unknown as NotificationInboundEvent, created: false }
    }
    console.error('[recordInboundEvent] insert error:', error)
    throw error
  }

  return { event: data as unknown as NotificationInboundEvent, created: true }
}

export async function isEventProcessed(providerMessageId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_inbound_events')
    .select('id')
    .eq('provider_message_id', providerMessageId)
    .eq('processed', true)
    .single()

  return !!data
}

export async function markEventProcessed(
  eventId: string,
  result?: { action?: string; errorMessage?: string; processingTimeMs?: number }
): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('notification_inbound_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      parsed_action: result?.action || null,
      error_message: result?.errorMessage || null,
      processing_time_ms: result?.processingTimeMs || null,
    })
    .eq('id', eventId)
}

export async function findPendingInboundEvents(limit: number = 50): Promise<NotificationInboundEvent[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_inbound_events')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(limit)

  return (data as unknown as NotificationInboundEvent[]) || []
}