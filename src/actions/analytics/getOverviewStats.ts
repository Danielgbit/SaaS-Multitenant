'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, format } from 'date-fns'
import { es } from 'date-fns/locale'

const PeriodSchema = z.enum(['today', 'week', 'month', 'year', 'last7days', 'last30days'])

type Period = z.infer<typeof PeriodSchema>

interface DateRange {
  start: Date
  end: Date
}

function getDateRange(period: Period): DateRange {
  const now = new Date()
  
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'last7days':
      return { start: subDays(now, 7), end: now }
    case 'last30days':
      return { start: subDays(now, 30), end: now }
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

function getPreviousDateRange(period: Period): DateRange {
  const now = new Date()
  
  switch (period) {
    case 'today':
      const yesterday = subDays(now, 1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
    case 'week':
      const lastWeekStart = subWeeks(now, 1)
      return { start: startOfWeek(lastWeekStart, { weekStartsOn: 1 }), end: endOfWeek(lastWeekStart, { weekStartsOn: 1 }) }
    case 'month':
      const lastMonthStart = subMonths(now, 1)
      return { start: startOfMonth(lastMonthStart), end: endOfMonth(lastMonthStart) }
    case 'year':
      const lastYearStart = subYears(now, 1)
      return { start: startOfYear(lastYearStart), end: endOfYear(lastYearStart) }
    case 'last7days':
      return { start: subDays(now, 14), end: subDays(now, 7) }
    case 'last30days':
      return { start: subDays(now, 60), end: subDays(now, 30) }
    default:
      const defLastMonthStart = subMonths(now, 1)
      return { start: startOfMonth(defLastMonthStart), end: endOfMonth(defLastMonthStart) }
  }
}

export async function getOverviewStats(
  organizationId: string,
  period: Period = 'month'
): Promise<{
  success: boolean
  data?: {
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
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { start, end } = getDateRange(period)
  const { start: prevStart, end: prevEnd } = getPreviousDateRange(period)

  // Current period stats
  const [{ data: currentStats }, { data: prevStats }] = await Promise.all([
    supabase
      .from('appointments')
      .select('status, start_time, client_id, created_at')
      .eq('organization_id', organizationId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString()),
    
    supabase
      .from('appointments')
      .select('status, start_time, client_id, created_at')
      .eq('organization_id', organizationId)
      .gte('start_time', prevStart.toISOString())
      .lte('start_time', prevEnd.toISOString())
  ])

  // Get revenue from appointments with services
  const [{ data: revenueData }, { data: prevRevenueData }] = await Promise.all([
    supabase
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
      .eq('status', 'completed')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString()),
    
    supabase
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
      .eq('status', 'completed')
      .gte('start_time', prevStart.toISOString())
      .lte('start_time', prevEnd.toISOString())
  ])

  // Calculate current revenue
  const currentRevenue = revenueData?.reduce((sum: number, apt: any) => {
    const services = apt.appointment_services as Array<{ services: { price: number } }>
    const aptRevenue = services?.reduce((s, svc) => s + (svc.services?.price || 0), 0) || 0
    return sum + aptRevenue
  }, 0) || 0

  // Calculate previous revenue
  const prevRevenue = prevRevenueData?.reduce((sum: number, apt: any) => {
    const services = apt.appointment_services as Array<{ services: { price: number } }>
    const aptRevenue = services?.reduce((s, svc) => s + (svc.services?.price || 0), 0) || 0
    return sum + aptRevenue
  }, 0) || 0

  // Calculate unique new clients in current period
  const currentClientsSet = new Set(
    (currentStats || [])
      .filter(a => new Date(a.created_at!) >= start)
      .map(a => a.client_id)
  )

  const prevClientsSet = new Set(
    (prevStats || [])
      .filter(a => new Date(a.created_at!) >= prevStart)
      .map(a => a.client_id)
  )

  // Calculate stats
  const appointments = currentStats?.length || 0
  const prevAppointments = prevStats?.length || 0
  const appointmentsChange = prevAppointments > 0 
    ? Math.round(((appointments - prevAppointments) / prevAppointments) * 100) 
    : 0

  const revenueChange = prevRevenue > 0 
    ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) 
    : 0

  const clients = currentClientsSet.size
  const prevClients = prevClientsSet.size
  const clientsChange = prevClients > 0 
    ? Math.round(((clients - prevClients) / prevClients) * 100) 
    : 0

  const completed = currentStats?.filter(a => a.status === 'completed').length || 0
  const prevCompleted = prevStats?.filter(a => a.status === 'completed').length || 0
  const completionRate = appointments > 0 ? Math.round((completed / appointments) * 100) : 0
  const prevCompletionRate = prevAppointments > 0 ? Math.round((prevCompleted / prevAppointments) * 100) : 0
  const completionRateChange = prevCompletionRate > 0 
    ? Math.round(completionRate - prevCompletionRate) 
    : 0

  const avgTicket = completed > 0 ? Math.round(currentRevenue / completed) : 0

  return {
    success: true,
    data: {
      appointments,
      appointmentsChange,
      revenue: currentRevenue,
      revenueChange,
      clients,
      clientsChange,
      completionRate,
      completionRateChange,
      avgTicket
    }
  }
}
