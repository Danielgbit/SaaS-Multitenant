'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { subDays } from 'date-fns'

const TopServicesSchema = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().min(1).max(20).default(5),
  days: z.number().min(7).max(365).default(30)
})

export async function getTopServices(
  organizationId: string,
  limit: number = 5,
  days: number = 30
): Promise<{
  success: boolean
  data?: Array<{
    serviceId: string
    serviceName: string
    count: number
    percentage: number
    revenue: number
  }>
  error?: string
}> {
  const parsed = TopServicesSchema.safeParse({ organizationId, limit, days })
  if (!parsed.success) {
    return { success: false, error: 'Parámetros inválidos' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const startDate = subDays(new Date(), days)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      start_time,
      appointment_services!inner(
        service_id,
        services!inner(id, name, price)
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', startDate.toISOString())
    .eq('status', 'completed')

  if (error) {
    console.error('Error fetching top services:', error)
    return { success: false, error: 'Error al obtener datos' }
  }

  // Aggregate by service
  const serviceMap = new Map<string, { name: string; count: number; revenue: number }>()

  appointments?.forEach(apt => {
    const services = apt.appointment_services as Array<{ 
      service_id: string
      services: { id: string; name: string; price: number }
    }>

    services?.forEach(svc => {
      const existing = serviceMap.get(svc.service_id) || { name: svc.services?.name || 'Unknown', count: 0, revenue: 0 }
      existing.count += 1
      existing.revenue += svc.services?.price || 0
      serviceMap.set(svc.service_id, existing)
    })
  })

  // Calculate total for percentages
  const total = Array.from(serviceMap.values()).reduce((sum, s) => sum + s.count, 0)

  // Convert to array and sort
  const topServices = Array.from(serviceMap.entries())
    .map(([serviceId, data]) => ({
      serviceId,
      serviceName: data.name,
      count: data.count,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      revenue: data.revenue
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return { success: true, data: topServices }
}
