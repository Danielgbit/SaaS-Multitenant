'use server'

import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

interface Activity {
  id: string
  type: 'appointment_created' | 'appointment_completed' | 'appointment_cancelled' | 'client_registered'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, string | null>
}

export async function getRecentActivity(
  organizationId: string,
  limit: number = 10
): Promise<{
  success: boolean
  data?: Activity[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const since = subDays(new Date(), 7)

  // Get recent appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      start_time,
      created_at,
      client_id,
      appointment_services!inner(
        services!inner(name)
      )
    `)
    .eq('organization_id', organizationId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit * 2)

  // Get recent clients
  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, name, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  // Fetch client names
  const clientIds = [...new Set((appointments || []).map(a => a.client_id).filter(Boolean))]
  const { data: clients } = clientIds.length > 0
    ? await supabase.from('clients').select('id, name').in('id', clientIds)
    : { data: [] }

  const clientsMap = new Map((clients || []).map(c => [c.id, c]))

  // Process appointments into activities
  const activities: Activity[] = []
  
  ;(appointments || []).forEach(apt => {
    const client = clientsMap.get(apt.client_id)
    const serviceName = (apt.appointment_services as any[])?.[0]?.services?.name
    const clientName = client?.name || 'Cliente'
    const time = apt.created_at

    if (apt.status === 'completed') {
      activities.push({
        id: `${apt.id}-completed`,
        type: 'appointment_completed',
        title: 'Cita completada',
        description: `${clientName} - ${serviceName || 'Servicio'}`,
        timestamp: time,
        metadata: { appointment_id: apt.id }
      })
    } else if (apt.status === 'cancelled' || apt.status === 'no_show') {
      activities.push({
        id: `${apt.id}-${apt.status}`,
        type: 'appointment_cancelled',
        title: apt.status === 'no_show' ? 'No asistio' : 'Cita cancelada',
        description: `${clientName} - ${serviceName || 'Servicio'}`,
        timestamp: time,
        metadata: { appointment_id: apt.id }
      })
    } else if (apt.status === 'confirmed' || apt.status === 'pending') {
      activities.push({
        id: `${apt.id}-created`,
        type: 'appointment_created',
        title: 'Nueva cita',
        description: `${clientName} - ${serviceName || 'Servicio'}`,
        timestamp: apt.start_time,
        metadata: { appointment_id: apt.id }
      })
    }
  })

  // Add new client registrations
  ;(recentClients || []).forEach(client => {
    activities.push({
      id: `client-${client.id}`,
      type: 'client_registered',
      title: 'Nuevo cliente',
      description: client.name,
      timestamp: client.created_at,
      metadata: { client_id: client.id }
    })
  })

  // Sort by timestamp descending and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  return {
    success: true,
    data: activities.slice(0, limit)
  }
}
