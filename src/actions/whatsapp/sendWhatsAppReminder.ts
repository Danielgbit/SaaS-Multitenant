/**
 * @deprecated V1 pathway
 * TODO post-MVP: migrate reminder dispatch to NotificationOrchestrator
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { enqueueShadowSeed } from '@/lib/notifications/shadow/seeder'
import { getWhatsappProvider } from '@/lib/notifications/providers'
import { appLog } from '@/lib/app-logger'

const SendReminderSchema = z.object({
  appointmentId: z.string().uuid(),
})

interface AppointmentData {
  id: string
  start_time: string
  end_time: string
  status: string
  client_id: string
  employee_id: string
  organization_id: string
  clients: {
    name: string
    phone: string
  } | null
  employees: {
    name: string
  } | null
  services: {
    name: string
    duration_minutes: number
  } | null
  organizations: {
    name: string
  } | null
}

export async function sendWhatsAppReminder(
  input: z.infer<typeof SendReminderSchema>
): Promise<{
  success: boolean
  error?: string
}> {
  const validation = SendReminderSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'ID de cita inválido' }
  }

  const { appointmentId } = validation.data

  const supabase = await createClient()

  try {
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        client_id,
        employee_id,
        organization_id,
        clients!inner(name, phone),
        employees!inner(name),
        services!inner(name, duration_minutes),
        organizations!inner(name)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      appLog('error', 'appointment fetch failed', {
        flow: 'sendWhatsAppReminder',
        operation: 'fetch_appointment',
        appointmentId,
        organizationId: appointment?.organization_id || null,
        error: appointmentError,
      })
      return { success: false, error: 'Cita no encontrada' }
    }

    const apt = appointment as unknown as AppointmentData

    if (!apt.clients?.phone) {
      return { success: false, error: 'Cliente sin número de teléfono' }
    }

    const provider = await getWhatsappProvider(apt.organization_id)

    if (!provider?.webhookUrl) {
      return { success: false, error: 'WhatsApp no está habilitado' }
    }

    const webhookUrl = provider.webhookUrl

    const appointmentDate = new Date(apt.start_time)
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const templateVariables: Record<string, string> = {
      name: apt.clients.name,
      phone: apt.clients.phone,
      date: formattedDate,
      time: formattedTime,
      business: apt.organizations?.name || '',
      service: apt.services?.name || '',
      employee: apt.employees?.name || '',
    }

    const messagePayload = {
      phone: apt.clients.phone,
      message: `¡Hola ${apt.clients.name}! Te recordamos que tienes una cita mañana (${formattedDate}) a las ${formattedTime} en ${apt.organizations?.name || 'nuestro establecimiento'}.`,
      variables: templateVariables,
      appointment_id: apt.id,
      message_type: 'reminder',
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(messagePayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const n8nResponse = await response.text()

    await supabase
      .from('whatsapp_logs')
      .insert({
        organization_id: apt.organization_id,
        appointment_id: apt.id,
        phone_number: apt.clients.phone,
        message_type: 'reminder',
        status: response.ok ? 'sent' : 'failed',
        error_message: response.ok ? null : n8nResponse,
        n8n_response: response.ok ? { status: response.status } : null,
        sent_at: response.ok ? new Date().toISOString() : null,
      })

    if (!response.ok) {
      appLog('error', 'n8n webhook failed', {
        flow: 'sendWhatsAppReminder',
        operation: 'webhook_post',
        appointmentId: apt.id,
        organizationId: apt.organization_id,
        status: response.status,
        response: n8nResponse,
      })

      await enqueueShadowSeed({
        appointmentId: apt.id,
        organizationId: apt.organization_id,
        to: apt.clients.phone,
        templateName: 'reminder',
        templateVariables: messagePayload.variables,
        renderedMessage: messagePayload.message,
        status: 'failed',
        responseStatus: response.status,
        errorMessage: n8nResponse,
        sentAt: new Date().toISOString(),
        providerUrl: webhookUrl,
        channel: 'whatsapp',
      })

      return { success: false, error: 'Error al enviar mensaje' }
    }

    await enqueueShadowSeed({
      appointmentId: apt.id,
      organizationId: apt.organization_id,
      to: apt.clients.phone,
      templateName: 'reminder',
      templateVariables: messagePayload.variables,
      renderedMessage: messagePayload.message,
      status: 'sent',
      responseStatus: response.status,
      sentAt: new Date().toISOString(),
      providerUrl: webhookUrl,
      channel: 'whatsapp',
    })

    return { success: true }
  } catch (error) {
    appLog('error', 'unexpected error', {
      flow: 'sendWhatsAppReminder',
      operation: 'execute',
      appointmentId,
      error,
    })
    return { success: false, error: 'Error inesperado' }
  }
}
