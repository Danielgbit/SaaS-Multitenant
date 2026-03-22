'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, addHours } from 'date-fns'

interface Alert {
  id: string
  type: 'whatsapp_failed' | 'unconfirmed_appointment' | 'info'
  severity: 'warning' | 'info' | 'success'
  title: string
  description: string
  link?: string
  linkLabel?: string
  count: number
}

export async function getSystemAlerts(
  organizationId: string
): Promise<{
  success: boolean
  data?: Alert[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const alerts: Alert[] = []

  // 1. WhatsApp failed messages (last 24 hours)
  const yesterday = addHours(new Date(), -24)
  const { count: failedWhatsApp } = await supabase
    .from('whatsapp_logs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'failed')
    .gte('created_at', yesterday.toISOString())

  if (failedWhatsApp && failedWhatsApp > 0) {
    alerts.push({
      id: 'whatsapp-failed',
      type: 'whatsapp_failed',
      severity: 'warning',
      title: 'Mensajes WhatsApp fallidos',
      description: `${failedWhatsApp} mensaje${failedWhatsApp > 1 ? 's' : ''} no pudieron ser entregados`,
      link: '/whatsapp?filter=failed',
      linkLabel: 'Ver detalles',
      count: failedWhatsApp
    })
  }

  // 2. Unconfirmed appointments (next 24 hours)
  const tomorrow = addHours(endOfDay(new Date()), 24)
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('id, status, start_time')
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'confirmed'])
    .gte('start_time', new Date().toISOString())
    .lte('start_time', tomorrow.toISOString())

  const unconfirmedCount = upcomingAppointments?.filter(
    apt => apt.status === 'pending'
  ).length || 0

  if (unconfirmedCount > 0) {
    alerts.push({
      id: 'unconfirmed',
      type: 'unconfirmed_appointment',
      severity: 'warning',
      title: 'Citas sin confirmar',
      description: `${unconfirmedCount} cita${unconfirmedCount > 1 ? 's' : ''} pendiente${unconfirmedCount > 1 ? 's' : ''} de confirmar`,
      link: '/calendar',
      linkLabel: 'Ver calendario',
      count: unconfirmedCount
    })
  }

  // If no alerts, add a success info message
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      type: 'info',
      severity: 'success',
      title: 'Todo en orden',
      description: 'No hay alertas pendientes',
      count: 0
    })
  }

  return {
    success: true,
    data: alerts
  }
}
