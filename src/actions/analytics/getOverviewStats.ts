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
  period: Period
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
  const label = `[analytics] getOverviewStats(${period})`
  console.time(label)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const { start, end } = getDateRange(period)
  const { start: prevStart, end: prevEnd } = getPreviousDateRange(period)

  // Use daily_analytics table (precomputed) instead of fetching all appointments
  const [{ data: currentDaily }, { data: prevDaily }] = await Promise.all([
    supabase
      .from('daily_analytics')
      .select('appointments_count, appointments_completed, revenue_cents, new_clients')
      .eq('organization_id', organizationId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]),
    
    supabase
      .from('daily_analytics')
      .select('appointments_count, appointments_completed, revenue_cents, new_clients')
      .eq('organization_id', organizationId)
      .gte('date', prevStart.toISOString().split('T')[0])
      .lte('date', prevEnd.toISOString().split('T')[0])
  ])

  // Aggregate daily data
  const appointments = (currentDaily || []).reduce((sum, d) => sum + (d.appointments_count || 0), 0)
  const prevAppointments = (prevDaily || []).reduce((sum, d) => sum + (d.appointments_count || 0), 0)
  const appointmentsChange = prevAppointments > 0 
    ? Math.round(((appointments - prevAppointments) / prevAppointments) * 100) 
    : 0
  
  const revenue = Math.round((currentDaily || []).reduce((sum, d) => sum + (d.revenue_cents || 0), 0) / 100)
  const prevRevenue = Math.round((prevDaily || []).reduce((sum, d) => sum + (d.revenue_cents || 0), 0) / 100)
  const revenueChange = prevRevenue > 0 
    ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) 
    : 0
  
  const clients = (currentDaily || []).reduce((sum, d) => sum + (d.new_clients || 0), 0)
  const prevClients = (prevDaily || []).reduce((sum, d) => sum + (d.new_clients || 0), 0)
  const clientsChange = prevClients > 0 
    ? Math.round(((clients - prevClients) / prevClients) * 100) 
    : 0
  
  const completed = (currentDaily || []).reduce((sum, d) => sum + (d.appointments_completed || 0), 0)
  const prevCompleted = (prevDaily || []).reduce((sum, d) => sum + (d.appointments_completed || 0), 0)
  const completionRate = appointments > 0 ? Math.round((completed / appointments) * 100) : 0
  const prevCompletionRate = prevAppointments > 0 ? Math.round((prevCompleted / prevAppointments) * 100) : 0
  const completionRateChange = prevCompletionRate > 0 
    ? Math.round(completionRate - prevCompletionRate) 
    : 0

  const avgTicket = completed > 0 ? Math.round(revenue / completed) : 0

  const result = {
    success: true,
    data: {
      appointments,
      appointmentsChange,
      revenue,
      revenueChange,
      clients,
      clientsChange,
      completionRate,
      completionRateChange,
      avgTicket,
    },
  }

  console.timeEnd(label)
  console.log(`${label} → days: ${(currentDaily || []).length}, queries: 2 (using daily_analytics)`)

  return result
}
