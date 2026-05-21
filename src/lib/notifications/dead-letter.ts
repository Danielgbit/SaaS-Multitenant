import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/notifications/logger'
import type { DeadLetterNotification, NotificationChannel } from '@/types/notifications'

interface MoveToDLQParams {
  queueItem: {
    id: string
    organization_id: string
    channel: NotificationChannel
    to_address?: string
    rendered_body?: string
    subject?: string
    variables: Record<string, string>
    last_error?: string
    error_code?: string
    attempts: number
    trace_id?: string
  }
}

export async function moveToDeadLetter(params: MoveToDLQParams): Promise<DeadLetterNotification> {
  const supabase = await createClient()
  const item = params.queueItem
  const traceId = item.trace_id || crypto.randomUUID()

  const { data, error } = await (supabase as any)
    .from('dead_letter_notifications')
    .insert({
      original_queue_id: item.id,
      organization_id: item.organization_id,
      channel: item.channel,
      to_address: item.to_address || null,
      rendered_body: item.rendered_body || null,
      subject: item.subject || null,
      variables: item.variables || {},
      last_error: item.last_error || null,
      error_code: item.error_code || null,
      attempts: item.attempts || 0,
      trace_id: traceId,
    })
    .select()
    .single()

  if (error) {
    logger.error('moveToDeadLetter failed', { originalQueueId: item.id, error })
    throw error
  }

  return data as DeadLetterNotification
}

export async function replayFromDeadLetter(dlqId: string): Promise<void> {
  const supabase = await createClient()

  const { data: dlqItem, error: findError } = await (supabase as any)
    .from('dead_letter_notifications')
    .select('*')
    .eq('id', dlqId)
    .eq('replay_status', 'pending')
    .single()

  if (findError || !dlqItem) {
    throw new Error('DLQ item no encontrado o ya procesado')
  }

  const { error: insertError } = await (supabase as any)
    .from('notification_queue')
    .insert({
      organization_id: dlqItem.organization_id,
      channel: dlqItem.channel,
      to_address: dlqItem.to_address,
      rendered_body: dlqItem.rendered_body,
      subject: dlqItem.subject,
      variables: dlqItem.variables,
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      trace_id: dlqItem.trace_id,
      scheduled_at: new Date().toISOString(),
    })

  if (insertError) {
    logger.error('replayFromDeadLetter re-insert failed', { dlqId, error: insertError })
    throw insertError
  }

  await (supabase as any)
    .from('dead_letter_notifications')
    .update({
      replay_status: 'replayed',
      replayed_at: new Date().toISOString(),
    })
    .eq('id', dlqId)
}

export async function discardFromDeadLetter(dlqId: string): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('dead_letter_notifications')
    .update({ replay_status: 'discarded' })
    .eq('id', dlqId)
}

export async function getDeadLetterItems(
  organizationId: string,
  limit: number = 100
): Promise<DeadLetterNotification[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('dead_letter_notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .order('moved_at', { ascending: false })
    .limit(limit)

  return (data as unknown as DeadLetterNotification[]) || []
}