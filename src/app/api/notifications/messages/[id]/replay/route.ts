import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logger } from '@/lib/notifications/logger'
import { logNotificationEvent } from '@/lib/notifications/event-timeline'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const { data: message } = await (supabase as any)
      .from('notification_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const organizationId = message.organization_id

    let originalQueueItemId: string | null = message.queue_item_id
    const originalTraceId: string | null = message.trace_id
    const originalProviderMessageId: string | null = message.provider_message_id

    if (!originalQueueItemId) {
      const { data: qi } = await (supabase as any)
        .from('notification_queue')
        .select('id')
        .eq('id', id)
        .single()

      if (qi) {
        originalQueueItemId = qi.id
      }
    }

    const newTraceId = randomUUID()
    const newCorrelationId = `replay_${newTraceId.slice(0, 8)}_${Date.now()}`
    const payload = message.payload as Record<string, unknown> | undefined
    const requestPayload = message.request_payload as Record<string, unknown> | undefined

    const insertData: Record<string, unknown> = {
      organization_id: organizationId,
      channel: message.channel,
      to_address: typeof payload?.to_address === 'string' ? payload.to_address : null,
      rendered_body: typeof payload?.body === 'string' ? payload.body : null,
      variables: (payload?.variables as Record<string, string>) || {},
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      trace_id: newTraceId,
      correlation_id: newCorrelationId,
      scheduled_at: new Date().toISOString(),
      replayed_from_queue_item_id: originalQueueItemId,
      replay_reason: 'manual_replay',
      manual_replay: true,
      replayed_at: new Date().toISOString(),
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        if (user) {
          insertData.replayed_by_user_id = user.id
        }
      } catch {}
    }

    if (!insertData.replayed_by_user_id) {
      const cookieHeader = request.headers.get('cookie') || ''
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const serverSupabase = await createClient()
        const { data: { user } } = await serverSupabase.auth.getUser()
        if (user) {
          insertData.replayed_by_user_id = user.id
        }
      } catch {}
    }

    const { data: newQueueItem, error: insertError } = await (supabase as any)
      .from('notification_queue')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      logger.error('Replay insert failed', { originalMessageId: id, error: insertError })
      return NextResponse.json({ error: 'Failed to create replay queue item' }, { status: 500 })
    }

    await logNotificationEvent({
      organizationId,
      queueItemId: newQueueItem.id,
      eventType: 'REPLAYED',
      metadata: {
        originalMessageId: id,
        originalQueueItemId,
        originalTraceId,
        originalProviderMessageId,
        reason: 'manual_replay',
        userId: insertData.replayed_by_user_id,
      },
      traceId: newTraceId,
      correlationId: newCorrelationId,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      newQueueItemId: newQueueItem.id,
    })
  } catch (error) {
    console.error('[POST /api/notifications/messages/[id]/replay]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
