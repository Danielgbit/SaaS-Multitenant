/**
 * @deprecated V1 WhatsApp functions. Use V2 notification system for new code.
 * @see src/lib/notifications/orchestrator.ts
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { enqueueShadowSeed } from '@/lib/notifications/shadow/seeder'
import { getWhatsappProvider } from '@/lib/notifications/providers'
import { appLog } from '@/lib/app-logger'

const WHATSAPP_TEMPLATES = {
  appointment_reminder: {
    name: 'Recordatorio de cita',
    template: '¡Hola {{name}}! Te recordamos que tienes una cita mañana a las {{time}} en {{business}}. ¡Te esperamos!',
  },
  appointment_confirmation: {
    name: 'Confirmación de cita',
    template: '¡Hola {{name}}! Tu cita ha sido confirmada para el {{date}} a las {{time}}. ¡Nos vemos pronto!',
  },
  appointment_cancelled: {
    name: 'Cita cancelada',
    template: 'Hola {{name}}, tu cita del {{date}} a las {{time}} ha sido cancelada. ¿Te gustaría reprogramar?',
  },
  appointment_completed: {
    name: 'Cita completada',
    template: '¡Gracias por tu visita, {{name}}! Esperamos verte pronto en {{business}}.',
  },
} as const

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES

export async function getWhatsAppTemplates() {
  return {
    success: true,
    templates: WHATSAPP_TEMPLATES,
  }
}

export async function getWhatsAppSettings(organizationId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('type', 'whatsapp')
      .single()

    if (error || !data) {
      return { 
        success: true, 
        data: { 
          status: 'disabled', 
          config: {} 
        } 
      }
    }

    return { success: true, data }
  } catch {
    return { 
      success: true, 
      data: { 
        status: 'disabled', 
        config: {} 
      } 
    }
  }
}

const QueueMessageSchema = z.object({
  organizationId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  phone: z.string().min(8),
  template: z.enum(['appointment_reminder', 'appointment_confirmation', 'appointment_cancelled', 'appointment_completed']),
  variables: z.record(z.string(), z.string()).optional(),
})

export async function queueWhatsAppMessage(
  input: z.infer<typeof QueueMessageSchema>
) {
  const parsed = QueueMessageSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { organizationId, appointmentId, phone, template, variables } = parsed.data
  const supabase = await createClient()

  try {
    const templateData = WHATSAPP_TEMPLATES[template]
    let message: string = templateData.template

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })
    }

    const provider = await getWhatsappProvider(organizationId)

    if (!provider?.webhookUrl) {
      appLog('error', 'no webhook URL configured', {
        flow: 'queueWhatsAppMessage',
        operation: 'config_check',
        organizationId,
      })
      return { success: false, error: 'WhatsApp no configurado' }
    }

    const webhookUrl = provider.webhookUrl
    const apiKey = provider.apiKey

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone,
        message,
        variables,
        appointment_id: appointmentId,
        message_type: template,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const n8nResponse = await response.text()

    await supabase
      .from('whatsapp_logs')
      .insert({
        organization_id: organizationId,
        appointment_id: appointmentId || null,
        phone_number: phone,
        message_type: template,
        status: response.ok ? 'sent' : 'failed',
        error_message: response.ok ? null : n8nResponse,
        n8n_response: response.ok ? { status: response.status } : null,
        sent_at: response.ok ? new Date().toISOString() : null,
      })

    if (!response.ok) {
      appLog('error', 'n8n webhook failed', {
        flow: 'queueWhatsAppMessage',
        operation: 'webhook_post',
        organizationId,
        status: response.status,
        response: n8nResponse,
      })
      return { success: false, error: 'Error al enviar mensaje' }
    }

    enqueueShadowSeed({
      appointmentId: appointmentId || '',
      organizationId,
      to: phone,
      templateName: template,
      templateVariables: variables || {},
      renderedMessage: message,
      status: 'sent',
      responseStatus: response.status,
      sentAt: new Date().toISOString(),
      providerUrl: webhookUrl,
      channel: 'whatsapp',
    }).catch(() => {})

    return { success: true }
  } catch (error) {
    appLog('error', 'unexpected error', {
      flow: 'queueWhatsAppMessage',
      operation: 'execute',
      organizationId,
      error,
    })
    return { success: false, error: 'Error inesperado' }
  }
}

export async function getWhatsAppQueue(organizationId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return { success: false, error: 'Error al cargar cola de mensajes' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: 'Error inesperado' }
  }
}

export async function retryWhatsAppMessage(messageId: string, organizationId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ 
        status: 'pending',
        attempts: 0,
        scheduled_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('organization_id', organizationId)

    if (error) {
      return { success: false, error: 'Error al reintentar mensaje' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error inesperado' }
  }
}

export async function cancelWhatsAppMessage(messageId: string, organizationId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ status: 'cancelled' })
      .eq('id', messageId)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')

    if (error) {
      return { success: false, error: 'Error al cancelar mensaje' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error inesperado' }
  }
}
