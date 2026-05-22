import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    const [queueCounts, deadLetterCount, recentEvents] = await Promise.all([
      (supabase as any)
        .from('notification_queue')
        .select('status, count', { count: 'exact', head: true })
        .in('status', ['pending', 'processing', 'sent', 'failed'])
        .then(() => Promise.all([
          (supabase as any).from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          (supabase as any).from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
          (supabase as any).from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
          (supabase as any).from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
        ])) as any,
      (supabase as any)
        .from('dead_letter_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('replay_status', 'pending') as any,
      (supabase as any)
        .from('notification_events')
        .select('event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(1) as any,
    ])

    const counts = {
      pending: queueCounts[0]?.count || 0,
      processing: queueCounts[1]?.count || 0,
      sent: queueCounts[2]?.count || 0,
      failed: queueCounts[3]?.count || 0,
    }

    const deadLetters = deadLetterCount?.count || 0
    const lastEvent = recentEvents?.[0]

    const stuckItems = await (supabase as any)
      .from('notification_queue')
      .select('id, created_at')
      .eq('status', 'processing')
      .lt('processing_timeout_at', new Date().toISOString())
      .limit(5)

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      queue: {
        ...counts,
        total: counts.pending + counts.processing + counts.sent + counts.failed,
        stuck: stuckItems?.length || 0,
      },
      deadLetters: {
        pending: deadLetters,
      },
      lastEvent: lastEvent
        ? { type: lastEvent.event_type, at: lastEvent.created_at }
        : null,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: msg,
    }, { status: 200 })
  }
}
