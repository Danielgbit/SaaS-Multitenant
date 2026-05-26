import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsShell, MotionSection } from '@/components/dashboard/notifications/NotificationsShell'
import { NotificationPolling } from '@/components/dashboard/notifications/NotificationPolling'
import { QueueHealthCards } from '@/components/dashboard/notifications/QueueHealthCards'
import { StuckProcessingAlert } from '@/components/dashboard/notifications/StuckProcessingAlert'
import { EventTimeline } from '@/components/dashboard/notifications/EventTimeline'
import { QueueChart } from '@/components/dashboard/notifications/QueueChart'
import { DeadLetterBanner } from '@/components/dashboard/notifications/DeadLetterBanner'
import { DashboardSearch } from '@/components/dashboard/notifications/DashboardSearch'
import { SystemStatusStrip } from '@/components/dashboard/notifications/SystemStatusStrip'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notificaciones | Prügressy',
  description: 'Monitor de cola de notificaciones y salud del sistema',
}

async function fetchNotificationData(organizationId: string) {
  const supabase = await createClient()

  try {
    const { data: queueData, error: queueError } = await (supabase as any)
      .from('notification_queue')
      .select('status')
      .eq('organization_id', organizationId)

    if (queueError) {
      console.error('Error fetching queue data:', queueError)
    }

    const countsByStatus: Record<string, number> = {}
    if (queueData) {
      for (const item of queueData) {
        countsByStatus[item.status] = (countsByStatus[item.status] || 0) + 1
      }
    }

    const { data: stuckItems, error: stuckError } = await (supabase as any)
      .from('notification_queue')
      .select('id, claimed_at, created_at, trace_id')
      .eq('organization_id', organizationId)
      .eq('status', 'processing')
      .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    if (stuckError) {
      console.error('Error fetching stuck items:', stuckError)
    }

    const { count: deadLetterCount, error: deadLetterError } = await (supabase as any)
      .from('dead_letter_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('replay_status', 'pending')

    if (deadLetterError) {
      console.error('Error fetching dead letters:', deadLetterError)
    }

    const { data: recentEvents, error: eventsError } = await (supabase as any)
      .from('notification_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsError) {
      console.error('Error fetching recent events:', eventsError)
    }

    const { data: hourlyData, error: hourlyError } = await (supabase as any)
      .from('notification_events')
      .select('created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (hourlyError) {
      console.error('Error fetching hourly data:', hourlyError)
    }

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

    const lastEventTime = recentEvents && recentEvents.length > 0
      ? Math.floor((Date.now() - new Date(recentEvents[0].created_at).getTime()) / 1000)
      : 0

    const queueHealth: 'healthy' | 'warning' | 'degraded' =
      countsByStatus['failed_permanently'] > 10 || countsByStatus['processing'] > 100
        ? 'degraded'
        : countsByStatus['failed'] > 5 || countsByStatus['processing'] > 50
          ? 'warning'
          : 'healthy'

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
      lastEventTime,
      queueHealth,
    }
  } catch (error) {
    console.error('Unexpected error in fetchNotificationData:', error)
    return {
      queue: { pending: 0, processing: 0, sent: 0, failed: 0, failed_permanently: 0 },
      stuck: 0,
      stuckItems: [],
      deadLetters: 0,
      recentEvents: [],
      hourlyStats: [],
      lastEventTime: 0,
      queueHealth: 'healthy' as const,
    }
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
    <NotificationsShell
      title="Notificaciones"
      subtitle="Monitor de cola y salud del sistema de notificaciones"
    >
      <NotificationPolling intervalMs={30000} enabled />

      <MotionSection>
        <SystemStatusStrip
          queueHealth={data.queueHealth}
          lastEventSecondsAgo={data.lastEventTime}
          isAutoRefreshing
        />
      </MotionSection>

      <MotionSection>
        <DashboardSearch />
      </MotionSection>

      <MotionSection>
        <QueueHealthCards queue={data.queue} deadLetters={data.deadLetters} />
      </MotionSection>

      {data.stuck > 0 && (
        <MotionSection>
          <StuckProcessingAlert stuckItems={data.stuckItems} />
        </MotionSection>
      )}

      {data.deadLetters > 0 && (
        <MotionSection>
          <DeadLetterBanner count={data.deadLetters} />
        </MotionSection>
      )}

      <MotionSection>
        <div className="grid gap-6 md:grid-cols-2">
          <QueueChart hourlyStats={data.hourlyStats} />
          <EventTimeline events={data.recentEvents} />
        </div>
      </MotionSection>
    </NotificationsShell>
  )
}
