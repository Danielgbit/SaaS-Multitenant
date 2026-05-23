import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QueueHealthCards } from '@/components/dashboard/notifications/QueueHealthCards'
import { StuckProcessingAlert } from '@/components/dashboard/notifications/StuckProcessingAlert'
import { EventTimeline } from '@/components/dashboard/notifications/EventTimeline'
import { QueueChart } from '@/components/dashboard/notifications/QueueChart'
import { DeadLetterBanner } from '@/components/dashboard/notifications/DeadLetterBanner'
import { DashboardSearch } from '@/components/dashboard/notifications/DashboardSearch'
import { SystemStatusStrip } from '@/components/dashboard/notifications/SystemStatusStrip'
import { Metadata } from 'next'
import { motion } from 'framer-motion'

export const metadata: Metadata = {
  title: 'Notificaciones | Prügressy',
  description: 'Monitor de cola de notificaciones y salud del sistema',
}

async function fetchNotificationData(organizationId: string) {
  const supabase = await createClient()

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

  const { data: stuckItems } = await (supabase as any)
    .from('notification_queue')
    .select('id, claimed_at, created_at, trace_id')
    .eq('organization_id', organizationId)
    .eq('status', 'processing')
    .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

  const { count: deadLetterCount } = await (supabase as any)
    .from('dead_letter_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('replay_status', 'pending')

  const { data: recentEvents } = await (supabase as any)
    .from('notification_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50)

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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
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
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
          }}
        />
      </div>

      <motion.div
        className="relative space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
              Notificaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor de cola y salud del sistema de notificaciones
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SystemStatusStrip
            queueHealth={data.queueHealth}
            workerCount={12}
            lastEventSecondsAgo={data.lastEventTime}
            isAutoRefreshing
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <DashboardSearch />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QueueHealthCards queue={data.queue} deadLetters={data.deadLetters} />
        </motion.div>

        {data.stuck > 0 && (
          <motion.div variants={itemVariants}>
            <StuckProcessingAlert stuckItems={data.stuckItems} />
          </motion.div>
        )}

        {data.deadLetters > 0 && (
          <motion.div variants={itemVariants}>
            <DeadLetterBanner count={data.deadLetters} />
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
          <QueueChart hourlyStats={data.hourlyStats} />
          <EventTimeline events={data.recentEvents} />
        </motion.div>
      </motion.div>
    </div>
  )
}
