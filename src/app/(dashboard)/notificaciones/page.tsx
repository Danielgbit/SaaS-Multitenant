import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QueueHealthCards } from '@/components/dashboard/notifications/QueueHealthCards'
import { StuckProcessingAlert } from '@/components/dashboard/notifications/StuckProcessingAlert'
import { EventTimeline } from '@/components/dashboard/notifications/EventTimeline'
import { QueueChart } from '@/components/dashboard/notifications/QueueChart'
import { DeadLetterBanner } from '@/components/dashboard/notifications/DeadLetterBanner'
import { DashboardSearch } from '@/components/dashboard/notifications/DashboardSearch'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notificaciones | Prügressy',
  description: 'Monitor de cola de notificaciones y salud del sistema',
}

async function fetchNotificationData(organizationId: string) {
  const supabase = await createClient()

  // Queue counts by status
  const { data: queueData } = await (supabase as any)
    .from('notification_queue')
    .select('status')
    .eq('organization_id', organizationId)

  const countsByStatus: Record<string, number> = {}
  if (queueData) {
    for (const item of queueData) {
      countsByStatus[item.status] = (countsByStatus[item.status] || 0) + 1
    }
  }

  // Stuck processing (>5 minutes)
  const { data: stuckItems } = await (supabase as any)
    .from('notification_queue')
    .select('id, claimed_at, created_at, trace_id')
    .eq('organization_id', organizationId)
    .eq('status', 'processing')
    .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

  // Dead letters pending
  const { count: deadLetterCount } = await (supabase as any)
    .from('dead_letter_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('replay_status', 'pending')

  // Recent events (last 50)
  const { data: recentEvents } = await (supabase as any)
    .from('notification_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Hourly aggregation for chart (last 24 hours)
  const { data: hourlyData } = await (supabase as any)
    .from('notification_events')
    .select('created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const hourlyStats: { hour: string; count: number }[] = []
  if (hourlyData) {
    const countsByHour: Record<string, number> = {}
    for (const event of hourlyData) {
      const hour = new Date(event.created_at).toISOString().slice(0, 13)
      countsByHour[hour] = (countsByHour[hour] || 0) + 1
    }
    for (const [hour, count] of Object.entries(countsByHour)) {
      hourlyStats.push({ hour, count })
    }
    hourlyStats.sort((a, b) => b.hour.localeCompare(a.hour))
    hourlyStats.splice(24)
  }

  return {
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
    hourlyStats,
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember?.organization_id) {
    redirect('/dashboard')
  }

  const data = await fetchNotificationData(orgMember.organization_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            Monitor de cola y salud del sistema de notificaciones
          </p>
        </div>
      </div>

      <DashboardSearch />

      <QueueHealthCards queue={data.queue} deadLetters={data.deadLetters} />

      {data.stuck > 0 && (
        <StuckProcessingAlert stuckItems={data.stuckItems} />
      )}

      {data.deadLetters > 0 && (
        <DeadLetterBanner count={data.deadLetters} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <QueueChart hourlyStats={data.hourlyStats} />
        <EventTimeline events={data.recentEvents} />
      </div>
    </div>
  )
}
