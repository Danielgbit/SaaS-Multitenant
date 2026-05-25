'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { subDays, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

const TrendSchema = z.object({
  organizationId: z.string().uuid(),
  days: z.number().min(7).max(90).default(30)
})

export async function getAppointmentsTrend(
  organizationId: string,
  days: number = 30
): Promise<{
  success: boolean
  data?: Array<{
    date: string
    label: string
    appointments: number
    completed: number
    revenue: number
  }>
  error?: string
}> {
  const label = `[analytics] getAppointmentsTrend(${days}d)`
  console.time(label)
  const parsed = TrendSchema.safeParse({ organizationId, days })
  if (!parsed.success) {
    console.timeEnd(label)
    return { success: false, error: 'Parámetros inválidos' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  // Use daily_analytics table (precomputed) instead of fetching all appointments
  const { data: dailyData, error } = await supabase
    .from('daily_analytics')
    .select('date, appointments_count, appointments_completed, revenue_cents')
    .eq('organization_id', organizationId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching daily_analytics:', error)
    return { success: false, error: 'Error al obtener datos' }
  }

  // Generate all dates in range and map to trend format
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
  const dailyMap = new Map(
    (dailyData || []).map((d: any) => [d.date, d])
  )

  const trendData = dateRange.map(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const data = dailyMap.get(dateKey) || { appointments_count: 0, appointments_completed: 0, revenue_cents: 0 }
    
    return {
      date: dateKey,
      label: format(date, 'EEE d', { locale: es }),
      appointments: data.appointments_count || 0,
      completed: data.appointments_completed || 0,
      revenue: Math.round((data.revenue_cents || 0) / 100)
    }
  })

  console.timeEnd(label)
  console.log(`${label} → days: ${(dailyData || []).length}, queries: 1 (using daily_analytics)`)

  return { success: true, data: trendData }
}
