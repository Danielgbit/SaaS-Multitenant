'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getOverviewStats } from './getOverviewStats'
import { getAppointmentsTrend } from './getAppointmentsTrend'
import { getTopServices } from './getTopServices'

const DashboardDataSchema = z.object({
  organizationId: z.string().uuid(),
  period: z.enum(['today', 'week', 'month', 'year', 'last7days', 'last30days']).default('month')
})

export async function getDashboardData(
  organizationId: string,
  period: 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days' = 'month'
): Promise<{
  success: boolean
  data?: {
    overview: {
      appointments: number
      appointmentsChange: number
      revenue: number
      revenueChange: number
      clients: number
      clientsChange: number
      completionRate: number
      completionRateChange: number
      avgTicket: number
    }
    trend: Array<{
      date: string
      label: string
      appointments: number
      completed: number
      revenue: number
    }>
    topServices: Array<{
      serviceId: string
      serviceName: string
      count: number
      percentage: number
      revenue: number
    }>
  }
  error?: string
}> {
  const parsed = DashboardDataSchema.safeParse({ organizationId, period })
  if (!parsed.success) {
    return { success: false, error: 'Parámetros inválidos' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Fetch all data in parallel
  const [overviewResult, trendResult, topServicesResult] = await Promise.all([
    getOverviewStats(organizationId, period),
    getAppointmentsTrend(organizationId, period === 'year' ? 90 : period === 'month' ? 30 : period === 'week' ? 14 : 7),
    getTopServices(organizationId, 5, period === 'year' ? 365 : period === 'month' ? 30 : period === 'week' ? 7 : 7)
  ])

  if (!overviewResult.success || !trendResult.success || !topServicesResult.success) {
    return { success: false, error: 'Error al obtener datos del dashboard' }
  }

  return {
    success: true,
    data: {
      overview: overviewResult.data!,
      trend: trendResult.data!,
      topServices: topServicesResult.data!
    }
  }
}
