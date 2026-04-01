'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/resend'
import { getEmailTemplate, EmailType } from '@/lib/email/templates'

const QueueEmailSchema = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
  appointmentId: z.string().uuid('ID de cita inválido').optional(),
  clientId: z.string().uuid('ID de cliente inválido').optional(),
  emailType: z.enum(['appointment_confirmation', 'appointment_reminder', 'appointment_cancelled', 'appointment_completed', 'appointment_no_show']),
  to: z.string().email('Email inválido'),
  variables: z.object({
    businessName: z.string(),
    clientName: z.string(),
    serviceName: z.string(),
    employeeName: z.string(),
    date: z.string(),
    time: z.string(),
    duration: z.string(),
    price: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
})

export async function queueEmailMessage(
  data: z.infer<typeof QueueEmailSchema>
): Promise<{ success: boolean; error?: string }> {
  const validation = QueueEmailSchema.safeParse(data)

  if (!validation.success) {
    console.error('Validation error:', validation.error.issues)
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const { organizationId, appointmentId, clientId, emailType, to, variables } = validation.data

  const supabase = await createClient()

  try {
    const { data: settings } = await (supabase as any)
      .from('email_settings')
      .select('enabled')
      .eq('organization_id', organizationId)
      .single()

    if (!settings?.enabled) {
      return { success: true }
    }

    const { subject, html } = getEmailTemplate(
      emailType,
      variables || {
        businessName: 'Tu negocio',
        clientName: 'Cliente',
        serviceName: 'Servicio',
        employeeName: 'Profesional',
        date: 'Fecha',
        time: 'Hora',
        duration: '30 min',
      }
    )

    const { data: emailData, error: emailError } = await sendEmail({
      to,
      subject,
      html,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)

      await (supabase as any)
        .from('email_logs')
        .insert({
          organization_id: organizationId,
          appointment_id: appointmentId || null,
          client_id: clientId || null,
          email_type: emailType,
          to_email: to,
          subject,
          status: 'failed',
          error_message: String(emailError),
        })

      return { success: false, error: 'Error al enviar email' }
    }

    await (supabase as any)
      .from('email_logs')
      .insert({
        organization_id: organizationId,
        appointment_id: appointmentId || null,
        client_id: clientId || null,
        email_type: emailType,
        to_email: to,
        subject,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

    return { success: true }
  } catch (error) {
    console.error('Error in queueEmailMessage:', error)

    await (supabase as any)
      .from('email_logs')
      .insert({
        organization_id: organizationId,
        appointment_id: appointmentId || null,
        client_id: clientId || null,
        email_type: emailType,
        to_email: to,
        subject: 'Error',
        status: 'failed',
        error_message: String(error),
      })

    return { success: false, error: 'Error inesperado' }
  }
}
