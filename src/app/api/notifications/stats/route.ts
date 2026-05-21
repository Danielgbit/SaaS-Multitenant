import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Queue counts by status
    const { data: queueCounts } = await (supabase as any)
      .from('notification_queue')
      .select('status')
      .eq('organization_id', organizationId)

    const countsByStatus: Record<string, number> = {}
    if (queueCounts) {
      for (const item of queueCounts) {
        countsByStatus[item.status] = (countsByStatus[item.status] || 0) + 1
      }
    }

    // Stuck processing (>5 minutes)
    const { data: stuckItems } = await (supabase as any)
      .from('notification_queue')
      .select('id, claimed_at, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'processing')
      .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    // Dead letters pending
    const { count: deadLetterCount } = await (supabase as any)
      .from('dead_letter_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('replay_status', 'pending')

    // Recent events (last 20)
    const { data: recentEvents } = await (supabase as any)
      .from('notification_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Hourly aggregation for chart (last 24 hours)
    const { data: hourlyData } = await (supabase as any)
      .from('notification_events')
      .select('created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    // Aggregate by hour
    const hourlyStats: { hour: string; count: number }[] = []
    if (hourlyData) {
      const countsByHour: Record<string, number> = {}
      for (const event of hourlyData) {
        const hour = new Date(event.created_at).toISOString().slice(0, 13) // YYYY-MM-DDTHH
        countsByHour[hour] = (countsByHour[hour] || 0) + 1
      }
      for (const [hour, count] of Object.entries(countsByHour)) {
        hourlyStats.push({ hour, count })
      }
      hourlyStats.sort((a, b) => b.hour.localeCompare(a.hour))
      hourlyStats.splice(24) // LIMIT 24
    }

    return NextResponse.json({
      queue: {
        pending: countsByStatus['pending'] || 0,
        processing: countsByStatus['processing'] || 0,
        sent: countsByStatus['sent'] || 0,
        failed: countsByStatus['failed'] || 0,
        failed_permanently: countsByStatus['failed_permanently'] || 0,
      },
      stuck: stuckItems?.length || 0,
      stuckItems: stuckItems || [],
      deadLetters: deadLetterCount || 0,
      recentEvents: recentEvents || [],
      hourlyStats: hourlyData || [],
    })
  } catch (error) {
    console.error('[notifications/stats] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
