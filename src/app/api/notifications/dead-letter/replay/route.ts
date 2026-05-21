import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logNotificationEvent } from '@/lib/notifications/event-timeline'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dlqId } = body as { dlqId: string }

    if (!dlqId) {
      return NextResponse.json({ error: 'dlqId required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Get DLQ item
    const { data: dlqItem, error: findError } = await (supabase as any)
      .from('dead_letter_notifications')
      .select('*')
      .eq('id', dlqId)
      .eq('replay_status', 'pending')
      .single()

    if (findError || !dlqItem) {
      return NextResponse.json({ error: 'Dead letter item not found or already processed' }, { status: 404 })
    }

    // Create NEW queue item (don't reuse original)
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
      console.error('[notifications/replay] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create queue item' }, { status: 500 })
    }

    // Mark DLQ as replayed
    await (supabase as any)
      .from('dead_letter_notifications')
      .update({
        replay_status: 'replayed',
        replayed_at: new Date().toISOString(),
      })
      .eq('id', dlqId)

    // Log REPLAYED event
    await logNotificationEvent({
      organizationId: dlqItem.organization_id,
      queueItemId: newQueueItem.id,
      eventType: 'REPLAYED',
      metadata: {
        originalDeadLetterId: dlqId,
        replayedBy: 'user', // TODO: get from auth
      },
      traceId: dlqItem.trace_id || undefined,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      newQueueItemId: newQueueItem.id,
    })
  } catch (error) {
    console.error('[notifications/replay] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
