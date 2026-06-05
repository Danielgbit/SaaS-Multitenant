'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { clientEnv } from '@/lib/env/client'
import { generateConfirmationToken } from '@/lib/appointments/confirmation-links/tokens'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { queueWhatsAppMessage } from '@/actions/whatsapp/whatsApp'
import { queueEmailMessage } from '@/actions/email/queueEmailMessage'
import { getWhatsappProvider } from '@/lib/notifications/providers'
import { appLog } from '@/lib/app-logger'
import { setRequestContext } from '@/lib/request-context'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import {
  validateCreateInput,
  checkCreatePreconditions,
  computeAppointmentTimes,
  verifySlotAvailability,
  insertAppointment,
} from '@/lib/appointments/create-appointment-core'

export async function createAppointment(
  input: unknown
): Promise<{ error?: string; success?: boolean; appointmentId?: string }> {
  setRequestContext({ flow: 'booking.create' })
  const validated = validateCreateInput(input)
  if (!validated.success) return { error: validated.error }

  const { employee_id, client_id, service_id, start_time, organization_id, notes } = validated.data
  const supabase = await createClient()

  const access = await requireOrgAccess(organization_id)
  if (!access.success) return { error: access.error }

  const preconditions = await checkCreatePreconditions(supabase, validated.data)
  if (!preconditions.success) return { error: preconditions.error }

  const { service } = preconditions.data

  const { startDate, endDate, normalizedStart } = computeAppointmentTimes(start_time, service.duration)

  const slotCheck = await verifySlotAvailability(supabase, employee_id, service_id, start_time, organization_id)
  if (!slotCheck.success) return { error: slotCheck.error }

  const insertResult = await insertAppointment(supabase, {
    organization_id,
    client_id,
    employee_id,
    service_id,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    notes: notes || null,
  })

  if (!insertResult.success) return { error: insertResult.error }

  const appointment = insertResult.data

  // Obtener datos para notificaciones
  const [clientData, employeeData, orgData, whatsappSettings, emailSettings, bookingSettingsData] = await Promise.all([
    supabase.from('clients').select('name, phone, email').eq('id', client_id).single().then(r => r.data),
    supabase.from('employees').select('name').eq('id', employee_id).single().then(r => r.data),
    supabase.from('organizations').select('name, phone, address').eq('id', organization_id).single().then(r => r.data),
    getWhatsappProvider(organization_id),
    supabase.from('email_settings').select('enabled, send_confirmation').eq('organization_id', organization_id).single().then((r: any) => r.data),
    supabase.from('booking_settings').select('timezone, reminder_hours_before, use_notification_v2').eq('organization_id', organization_id).single().then((r: any) => r.data),
  ])

  const useNotificationV2 = (bookingSettingsData as any)?.use_notification_v2 === true

  // Generar confirmation token
  const appUrl = clientEnv?.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const tokenResult = await generateConfirmationToken(appointment.id, organization_id, 'confirm')
  const confirmationLink = tokenResult.success && tokenResult.token
    ? `${appUrl}/confirmar/${tokenResult.token}`
    : undefined

  // Notificaciones
  if (useNotificationV2) {
    try {
      const { NotificationOrchestrator } = await import('@/lib/notifications/orchestrator')
      await NotificationOrchestrator('appointment_created', appointment.id, {
        id: appointment.id,
        organization_id,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        client_id,
        employee_id,
        status: appointment.status,
        confirmation_status: 'pending_confirmation',
        clients: clientData || null,
        employees: employeeData ? { name: employeeData.name, user_id: '' } : null,
        services: null,
        organizations: orgData || null,
        booking_settings: bookingSettingsData || undefined,
      } as any, { confirmationLink })
    } catch (orchestratorError) {
      appLog('error', 'orchestrator failed', {
        flow: 'createAppointment',
        operation: 'orchestrate',
        organization_id,
        employee_id,
        client_id,
        service_id,
        start_time,
        error: orchestratorError,
      })
    }
  } else {
    try {
      if (whatsappSettings && clientData?.phone) {
        await queueWhatsAppMessage({
          organizationId: organization_id,
          appointmentId: appointment.id,
          phone: clientData.phone,
          template: 'appointment_confirmation',
          variables: {
            name: clientData.name,
            date: startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
            time: startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          },
        })
      }

      if (emailSettings?.enabled && emailSettings?.send_confirmation && clientData?.email) {
        await queueEmailMessage({
          organizationId: organization_id,
          appointmentId: appointment.id,
          clientId: client_id,
          emailType: 'appointment_confirmation',
          to: clientData.email,
          variables: {
            businessName: (orgData as any)?.name || 'Negocio',
            clientName: clientData.name,
            serviceName: service.name || 'Servicio',
            employeeName: employeeData?.name || 'Profesional',
            date: startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
            time: startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            duration: `${service.duration} min`,
            price: service.price ? formatCurrencyCOP(service.price) : undefined,
          },
        })
      }
    } catch (notificationError) {
      appLog('warn', 'notification dispatch failed', {
        flow: 'createAppointment',
        operation: 'notify',
        organization_id,
        appointment_id: appointment?.id,
        error: notificationError,
      })
    }
  }

  revalidatePath('/calendar')
  revalidatePath('/employees')

  return { success: true, appointmentId: appointment.id }
}

// =============================================================================
// UPDATE STATUS
// =============================================================================

import {
  validateUpdateStatusInput,
  checkUpdateStatusPreconditions,
  updateAppointmentStatusInDb,
} from '@/lib/appointments/update-appointment-core'

export async function updateAppointmentStatus(
  input: unknown
): Promise<{ error?: string; success?: boolean }> {
  const validated = validateUpdateStatusInput(input)
  if (!validated.success) return { error: validated.error }

  const { appointment_id, status } = validated.data
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const preconditions = await checkUpdateStatusPreconditions(supabase, appointment_id, user.id)
  if (!preconditions.success) return { error: preconditions.error }

  const { error: updateError } = await updateAppointmentStatusInDb(supabase, appointment_id, status)
  if (updateError) return { error: updateError }

  // Shadow Mode (deprecated — no-op stub)
  if (status === 'canceled') {
    import('@/lib/shadow').catch(() => {})
  }

  // Email para cambios de estado críticos
  if (status === 'canceled' || status === 'completed' || status === 'no_show') {
    try {
      const { data: aptData } = await supabase
        .from('appointments')
        .select('client_id, employee_id, start_time')
        .eq('id', appointment_id)
        .single()

      if (aptData?.client_id && aptData?.employee_id) {
        const { data: clientInfo } = await supabase
          .from('clients')
          .select('name, email')
          .eq('id', aptData.client_id)
          .single()

        if (clientInfo?.email) {
          const { data: empInfo } = await supabase
            .from('employees')
            .select('name')
            .eq('id', aptData.employee_id)
            .single()

          const { data: emailCfg } = await supabase
            .from('email_settings')
            .select('enabled')
            .eq('organization_id', preconditions.data.organization_id)
            .single()

          if (emailCfg?.enabled) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', preconditions.data.organization_id)
              .single()

            const startDate = new Date(aptData.start_time)
            const emailType = status === 'canceled' ? 'appointment_cancelled'
              : status === 'completed' ? 'appointment_completed'
              : 'appointment_no_show'

            await queueEmailMessage({
              organizationId: preconditions.data.organization_id,
              appointmentId: appointment_id,
              clientId: aptData.client_id,
              emailType,
              to: clientInfo.email,
              variables: {
                businessName: org?.name || 'Negocio',
                clientName: clientInfo.name,
                serviceName: 'Servicio',
                employeeName: empInfo?.name || 'Profesional',
                date: startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
                time: startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                duration: '30 min',
              },
            })
          }
        }
      }
    } catch (emailError) {
      appLog('warn', 'status email dispatch failed', {
        flow: 'updateAppointmentStatus',
        operation: 'send_email',
        organization_id: preconditions.data.organization_id,
        appointment_id,
        error: emailError,
      })
    }
  }

  revalidatePath('/calendar')
  revalidatePath('/employees')

  return { success: true }
}
