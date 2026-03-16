'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ResendReminderSchema = z.object({
  logId: z.string().uuid(),
})

export async function resendWhatsAppReminder(
  input: z.infer<typeof ResendReminderSchema>
): Promise<{
  success: boolean
  error?: string
}> {
  const validation = ResendReminderSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'ID de log inválido' }
  }

  const { logId } = validation.data
  const supabase = await createClient()

  try {
    const { data: log, error: logError } = await (supabase as any)
      .from('whatsapp_logs')
      .select('appointment_id, organization_id')
      .eq('id', logId)
      .single()

    if (logError || !log) {
      return { success: false, error: 'Log no encontrado' }
    }

    if (!log.appointment_id) {
      return { success: false, error: 'El log no tiene una cita asociada' }
    }

    const { data: appointment, error: aptError } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        start_time,
        status,
        client_id,
        employees!inner(name),
        services!inner(name, duration_minutes),
        organizations!inner(name),
        clients!inner(name, phone)
      `)
      .eq('id', log.appointment_id)
      .single()

    if (aptError || !appointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    const clients = appointment.clients as { name: string; phone: string } | null
    if (!clients?.phone) {
      return { success: false, error: 'Cliente sin número de teléfono' }
    }

    const { data: settings, error: settingsError } = await (supabase as any)
      .from('whatsapp_settings')
      .select('webhook_url, api_key')
      .eq('organization_id', log.organization_id)
      .single()

    if (settingsError || !settings?.webhook_url) {
      return { success: false, error: 'WhatsApp no configurado' }
    }

    const appointmentDate = new Date(appointment.start_time)
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const employees = appointment.employees as { name: string } | null
    const services = appointment.services as { name: string } | null
    const organizations = appointment.organizations as { name: string } | null

    const messagePayload = {
      phone: clients.phone,
      message: `¡Hola ${clients.name}! Te recordamos que tienes una cita mañana (${formattedDate}) a las ${formattedTime} en ${organizations?.name || 'nuestro establecimiento'}.`,
      variables: {
        name: clients.name,
        phone: clients.phone,
        date: formattedDate,
        time: formattedTime,
        business: organizations?.name,
        service: services?.name,
        employee: employees?.name,
      },
      appointment_id: appointment.id,
      message_type: 'reminder',
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (settings.api_key) {
      headers['Authorization'] = `Bearer ${settings.api_key}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(settings.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(messagePayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const n8nResponse = await response.text()

    await (supabase as any)
      .from('whatsapp_logs')
      .insert({
        organization_id: log.organization_id,
        appointment_id: log.appointment_id,
        phone_number: clients.phone,
        message_type: 'reminder',
        status: response.ok ? 'sent' : 'failed',
        error_message: response.ok ? null : n8nResponse,
        n8n_response: response.ok ? { status: response.status } : null,
        sent_at: response.ok ? new Date().toISOString() : null,
      })

    if (!response.ok) {
      return { success: false, error: 'Error al reenviar mensaje' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in resendWhatsAppReminder:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
