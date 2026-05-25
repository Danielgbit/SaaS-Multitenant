'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfToday, endOfToday, subDays } from 'date-fns'
import type { TodayPulse, emptyTodayPulse } from '@/types/analytics'

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function getTodayPulse(
  organizationId: string
): Promise<{
  success: boolean
  data?: TodayPulse
  error?: string
}> {
  const label = '[analytics] getTodayPulse()'
  console.time(label)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const today = startOfToday().toISOString().split('T')[0]
  const yesterday = subDays(startOfToday(), 1).toISOString().split('T')[0]
  const startOfDay = startOfToday().toISOString()
  const endOfDay = endOfToday().toISOString()

  const AVG_SERVICE_VALUE_CENTS = 35000

  const [analyticsResult, pendingResult, yesterdayResult] = await Promise.all([
    supabase
      .from('daily_analytics')
      .select('revenue_cents, appointments_completed, appointments_no_show, appointments_count')
      .eq('organization_id', organizationId)
      .eq('date', today)
      .single(),

    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay),

    supabase
      .from('daily_analytics')
      .select('revenue_cents')
      .eq('organization_id', organizationId)
      .eq('date', yesterday)
      .single(),
  ])

  if (analyticsResult.error && analyticsResult.error.code !== 'PGRST116') {
    console.timeEnd(label)
    return { success: false, error: analyticsResult.error.message }
  }

  const analytics = analyticsResult.data
  const currentRevenue = analytics?.revenue_cents || 0
  const previousRevenue = yesterdayResult.data?.revenue_cents || 0

  const revenue = Math.round(currentRevenue / 100)
  const revenueChange = calculateChange(currentRevenue, previousRevenue)
  const completedToday = analytics?.appointments_completed || 0
  const noShowsToday = analytics?.appointments_no_show || 0
  const totalAppointments = analytics?.appointments_count || 0

  const pendingConfirmations = pendingResult.count || 0
  const noShowImpact = noShowsToday * AVG_SERVICE_VALUE_CENTS

  const totalBookedMinutes = totalAppointments * 60
  const availableMinutes = 12 * 60
  const capacityPercentToday = availableMinutes > 0
    ? Math.min(100, Math.round((totalBookedMinutes / availableMinutes) * 100))
    : 0

  const data: TodayPulse = {
    revenue,
    revenueChange,
    completedToday,
    totalBookedMinutes,
    availableMinutes,
    capacityPercentToday,
    pendingConfirmations,
    noShowsToday,
    noShowImpact,
    period: 'today',
  }

  console.timeEnd(label)
  console.log(`[analytics] getTodayPulse() → revenue: ${revenue}, completed: ${completedToday}, pending: ${pendingConfirmations}, noShows: ${noShowsToday}`)

  return { success: true, data }
}
