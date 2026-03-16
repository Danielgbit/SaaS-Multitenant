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
  const parsed = TrendSchema.safeParse({ organizationId, days })
  if (!parsed.success) {
    return { success: false, error: 'Parámetros inválidos' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      start_time,
      appointment_services!inner(
        service_id,
        services!inner(price)
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
    return { success: false, error: 'Error al obtener datos' }
  }

  // Generate all dates in range
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

  // Group appointments by date
  const trendMap = new Map<string, { appointments: number; completed: number; revenue: number }>()

  dateRange.forEach(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    trendMap.set(dateKey, { appointments: 0, completed: 0, revenue: 0 })
  })

  appointments?.forEach(apt => {
    const dateKey = format(new Date(apt.start_time), 'yyyy-MM-dd')
    const existing = trendMap.get(dateKey) || { appointments: 0, completed: 0, revenue: 0 }
    
    existing.appointments += 1
    if (apt.status === 'completed') {
      existing.completed += 1
    }

    // Calculate revenue
    const services = apt.appointment_services as Array<{ services: { price: number } }>
    const aptRevenue = services?.reduce((sum, svc) => sum + (svc.services?.price || 0), 0) || 0
    if (apt.status === 'completed') {
      existing.revenue += aptRevenue
    }

    trendMap.set(dateKey, existing)
  })

  const trendData = dateRange.map(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const data = trendMap.get(dateKey) || { appointments: 0, completed: 0, revenue: 0 }
    
    return {
      date: dateKey,
      label: format(date, 'EEE d', { locale: es }),
      appointments: data.appointments,
      completed: data.completed,
      revenue: data.revenue
    }
  })

  return { success: true, data: trendData }
}
