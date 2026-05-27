import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/../types/supabase'
import { logNotificationEvent } from '@/lib/notifications/event-timeline'

export async function requeueStuckNotification(
  supabase: SupabaseClient<Database>,
  queueItemId: string
) {
  const { data: item, error: findError } = await (supabase as any)
    .from('notification_queue')
    .select('id, organization_id, status, claimed_at, trace_id')
    .eq('id', queueItemId)
    .eq('status', 'processing')
    .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .single()

  if (findError || !item) {
    throw new Error('Item not found or not stuck (must be processing >5 minutes)')
  }

  const { error: updateError } = await (supabase as any)
    .from('notification_queue')
    .update({
      status: 'pending',
      claimed_at: null,
      claimed_by: null,
      last_error: null,
      processing_timeout_at: null,
      next_retry_at: new Date().toISOString(),
    })
    .eq('id', queueItemId)

  if (updateError) {
    throw new Error('Failed to requeue item')
  }

  await logNotificationEvent({
    organizationId: item.organization_id,
    queueItemId,
    eventType: 'REQUEUED_FROM_STUCK',
    metadata: { reason: 'stuck_processing_recovery' },
    traceId: item.trace_id || undefined,
  }).catch(() => {})

  return { queueItemId }
}

export async function replayDeadLetterNotification(
  supabase: SupabaseClient<Database>,
  dlqId: string
) {
  const { data: dlqItem, error: findError } = await (supabase as any)
    .from('dead_letter_notifications')
    .select('*')
    .eq('id', dlqId)
    .eq('replay_status', 'pending')
    .single()

  if (findError || !dlqItem) {
    throw new Error('Dead letter item not found or already processed')
  }

  const { data: newQueueItem, error: insertError } = await (supabase as any)
    .from('notification_queue')
    .insert({
      organization_id: dlqItem.organization_id,
      appointment_id: (dlqItem.variables as Record<string, string>)?.appointmentId || null,
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
    .select()
    .single()

  if (insertError) {
    throw new Error('Failed to create queue item')
  }

  await (supabase as any)
    .from('dead_letter_notifications')
    .update({
      replay_status: 'replayed',
      replayed_at: new Date().toISOString(),
    })
    .eq('id', dlqId)

  await logNotificationEvent({
    organizationId: dlqItem.organization_id,
    queueItemId: newQueueItem.id,
    eventType: 'REPLAYED',
    metadata: {
      originalDeadLetterId: dlqId,
    },
    traceId: dlqItem.trace_id || undefined,
  }).catch(() => {})

  return { newQueueItemId: newQueueItem.id }
}

export async function discardDeadLetterNotification(
  supabase: SupabaseClient<Database>,
  dlqId: string
) {
  const { error } = await (supabase as any)
    .from('dead_letter_notifications')
    .update({ replay_status: 'discarded' })
    .eq('id', dlqId)
    .eq('replay_status', 'pending')

  if (error) {
    throw new Error('Failed to discard dead letter')
  }

  return { success: true }
}
