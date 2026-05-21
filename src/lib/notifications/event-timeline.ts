import { createClient } from '@/lib/supabase/server'
import type { NotificationEvent, NotificationEventType } from '@/types/notifications'

interface LogEventParams {
  organizationId?: string
  queueItemId?: string
  messageId?: string
  conversationId?: string
  eventType: NotificationEventType
  metadata?: Record<string, unknown>
  traceId?: string
}

export async function logNotificationEvent(params: LogEventParams): Promise<void> {
  const supabase = await createClient()

  await (supabase as any)
    .from('notification_events')
    .insert({
      organization_id: params.organizationId,
      queue_item_id: params.queueItemId || null,
      message_id: params.messageId || null,
      conversation_id: params.conversationId || null,
      event_type: params.eventType,
      metadata: params.metadata || {},
      trace_id: params.traceId || null,
    })
}

export async function getEventTimeline(
  queueItemId: string
): Promise<NotificationEvent[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_events')
    .select('*')
    .eq('queue_item_id', queueItemId)
    .order('created_at', { ascending: true })

  return (data as unknown as NotificationEvent[]) || []
}

export async function getRecentEvents(
  organizationId: string,
  limit: number = 50
): Promise<NotificationEvent[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as unknown as NotificationEvent[]) || []
}