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
    const { queueItemId } = body as { queueItemId: string }

    if (!queueItemId) {
      return NextResponse.json({ error: 'queueItemId required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Validate item is actually stuck (>5 minutes in processing)
    const { data: item, error: findError } = await (supabase as any)
      .from('notification_queue')
      .select('id, organization_id, status, claimed_at, trace_id')
      .eq('id', queueItemId)
      .eq('status', 'processing')
      .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .single()

    if (findError || !item) {
      return NextResponse.json({ 
        error: 'Item not found or not stuck (must be processing >5 minutes)', 
      }, { status: 400 })
    }

    // Requeue: reset to pending and clear metadata
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
      console.error('[notifications/requeue] update error:', updateError)
      return NextResponse.json({ error: 'Failed to requeue' }, { status: 500 })
    }

    // Log REQUEUED_FROM_STUCK event
    await logNotificationEvent({
      organizationId: item.organization_id,
      queueItemId,
      eventType: 'REQUEUED_FROM_STUCK',
      metadata: { reason: 'stuck_processing_recovery' },
      traceId: item.trace_id || undefined,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      queueItemId,
    })
  } catch (error) {
    console.error('[notifications/requeue] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
