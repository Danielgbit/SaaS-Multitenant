import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/notifications/logger'
import type { NotificationChannel, NotificationInboundEvent, NotificationProviderType } from '@/types/notifications'

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
    const existingMapped = existing as unknown as Record<string, unknown>
    return {
      event: {
        id: existingMapped.id as string,
        organizationId: existingMapped.organization_id as string | undefined,
        providerMessageId: existingMapped.provider_message_id as string,
        channel: existingMapped.channel as NotificationChannel,
        provider: existingMapped.provider as NotificationProviderType,
        fromPhone: existingMapped.from_phone as string | undefined,
        rawPayload: existingMapped.raw_payload as Record<string, unknown>,
        parsedAction: existingMapped.parsed_action as string | undefined,
        processed: existingMapped.processed as boolean,
        processedAt: existingMapped.processed_at as string | undefined,
        processingTimeMs: existingMapped.processing_time_ms as number | undefined,
        errorMessage: existingMapped.error_message as string | undefined,
        traceId: existingMapped.trace_id as string | undefined,
        createdAt: existingMapped.created_at as string,
      },
      created: false,
    }
  }

  const traceId = params.traceId || crypto.randomUUID()

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
      const retryMapped = retry as unknown as Record<string, unknown>
      return {
        event: {
          id: retryMapped.id as string,
          organizationId: retryMapped.organization_id as string | undefined,
          providerMessageId: retryMapped.provider_message_id as string,
          channel: retryMapped.channel as NotificationChannel,
          provider: retryMapped.provider as NotificationProviderType,
          fromPhone: retryMapped.from_phone as string | undefined,
          rawPayload: retryMapped.raw_payload as Record<string, unknown>,
          parsedAction: retryMapped.parsed_action as string | undefined,
          processed: retryMapped.processed as boolean,
          processedAt: retryMapped.processed_at as string | undefined,
          processingTimeMs: retryMapped.processing_time_ms as number | undefined,
          errorMessage: retryMapped.error_message as string | undefined,
          traceId: retryMapped.trace_id as string | undefined,
          createdAt: retryMapped.created_at as string,
        },
        created: false,
      }
    }
    logger.error('recordInboundEvent insert failed', { providerMessageId: params.providerMessageId, error })
    throw error
  }

  const mapped = data as unknown as Record<string, unknown>
  const event: NotificationInboundEvent = {
    id: mapped.id as string,
    organizationId: mapped.organization_id as string | undefined,
    providerMessageId: mapped.provider_message_id as string,
    channel: mapped.channel as NotificationChannel,
    provider: mapped.provider as NotificationProviderType,
    fromPhone: mapped.from_phone as string | undefined,
    rawPayload: mapped.raw_payload as Record<string, unknown>,
    parsedAction: mapped.parsed_action as string | undefined,
    processed: mapped.processed as boolean,
    processedAt: mapped.processed_at as string | undefined,
    processingTimeMs: mapped.processing_time_ms as number | undefined,
    errorMessage: mapped.error_message as string | undefined,
    traceId: mapped.trace_id as string | undefined,
    createdAt: mapped.created_at as string,
  }
  return { event, created: true }
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