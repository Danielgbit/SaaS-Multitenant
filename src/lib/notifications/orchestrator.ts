import { createClient } from '@/lib/supabase/server'
import { createChannel } from '@/lib/notifications/channels'
import { getTemplateWithRender } from '@/lib/notifications/template-engine'
import {
  type AutomationTrigger,
  type NotificationChannel,
  type TemplateType,
  type SendResult,
  generateIdempotencyKey,
} from '@/types/notifications'
import { randomUUID } from 'crypto'
import { getOrCreateConversation } from './conversations'
import { logNotificationEvent } from './event-timeline'

interface AppointmentData {
  id: string
  organization_id: string
  start_time: string
  end_time: string
  client_id: string
  employee_id: string
  status: string
  confirmation_status: string
  clients: {
    name: string
    phone: string | null
    email: string | null
    confirmation_method?: string
    confirmations_enabled?: boolean
    preferred_contact?: string
  } | null
  employees: {
    name: string
    user_id: string
  } | null
  services: {
    name: string
  } | null
  organizations: {
    name: string
    phone?: string
    address?: string
  } | null
  booking_settings?: {
    timezone: string
    reminder_hours_before: number
  } | null
}

interface OrchestratorResult {
  success: boolean
  queued: number
  sent: number
  errors: string[]
  traceId: string
}

function buildTemplateVariables(
  appointment: AppointmentData,
  confirmationLink?: string,
  cancellationLink?: string,
  rescheduleLink?: string
): Record<string, string> {
  const date = new Date(appointment.start_time)
  const formattedDate = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: appointment.booking_settings?.timezone || 'America/Bogota',
  })
  const formattedTime = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: appointment.booking_settings?.timezone || 'America/Bogota',
  })

  return {
    clientName: appointment.clients?.name || 'Cliente',
    appointmentDate: formattedDate,
    appointmentTime: formattedTime,
    businessName: appointment.organizations?.name || 'Negocio',
    serviceName: appointment.services?.name || '',
    employeeName: appointment.employees?.name || '',
    confirmationLink: confirmationLink || '',
    cancellationLink: cancellationLink || '',
    rescheduleLink: rescheduleLink || '',
    businessPhone: appointment.organizations?.phone || '',
    businessAddress: appointment.organizations?.address || '',
  }
}

async function getAutomationRules(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  trigger: AutomationTrigger
) {
  const { data } = await (supabase as any)
    .from('automation_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('trigger_event', trigger)
    .eq('is_enabled', true)

  return data || []
}

async function getNotificationProvider(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  channel: NotificationChannel
) {
  const { data } = await (supabase as any)
    .from('notification_providers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('channel', channel)
    .eq('is_enabled', true)
    .single()

  return data
}

async function getBookingSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string
) {
  const { data } = await (supabase as any)
    .from('booking_settings')
    .select('timezone, reminder_hours_before')
    .eq('organization_id', organizationId)
    .single()

  return data
}

export async function NotificationOrchestrator(
  trigger: AutomationTrigger,
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  const supabase = await createClient()
  const traceId = randomUUID()
  const errors: string[] = []
  let queued = 0
  let sent = 0

  try {
    const appointment = appointmentData || await fetchAppointment(supabase, appointmentId)
    if (!appointment) {
      return { success: false, queued: 0, sent: 0, errors: ['Appointment not found'], traceId }
    }

    const bookingSettings = await getBookingSettings(supabase, appointment.organization_id)
    appointment.booking_settings = bookingSettings || undefined

    const rules = await getAutomationRules(supabase, appointment.organization_id, trigger)
    if (rules.length === 0) {
      return { success: true, queued: 0, sent: 0, errors: [], traceId }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    for (const rule of rules) {
      try {
        if (rule.channel === 'in_app') continue

        const provider = await getNotificationProvider(supabase, appointment.organization_id, rule.channel)
        if (!provider) {
          errors.push(`No provider configured for channel ${rule.channel}`)
          continue
        }

        const template = await getTemplateWithRender(
          appointment.organization_id,
          rule.channel,
          rule.template_id ? '' : (trigger as string),
          {}
        )

        if (!template && !rule.template_id) {
          errors.push(`No template found for ${rule.channel}/${trigger}`)
          continue
        }

        let templateId = rule.template_id || ''
        const variables = buildTemplateVariables(appointment)

        const renderedBody = template?.body || ''
        const renderedSubject = template?.subject

        const toAddress = getRecipientAddress(appointment, rule.channel)
        if (!toAddress) {
          errors.push(`No recipient address for channel ${rule.channel}`)
          continue
        }

        const scheduledDate = new Date(appointment.start_time)
        const delayMinutes = rule.delay_minutes || 0
        scheduledDate.setMinutes(scheduledDate.getMinutes() - delayMinutes)

        const idempotencyKey = generateIdempotencyKey(
          appointment.organization_id,
          appointmentId,
          rule.channel,
          (trigger as TemplateType) || 'appointment_confirmation',
          scheduledDate
        )

        const queueItem = {
          organization_id: appointment.organization_id,
          appointment_id: appointmentId,
          channel: rule.channel,
          template_id: templateId || null,
          to_address: toAddress,
          subject: renderedSubject || null,
          rendered_body: renderedBody,
          variables,
          status: 'pending' as const,
          idempotency_key: idempotencyKey,
          attempts: 0,
          max_attempts: 3,
          trace_id: traceId,
          scheduled_at: scheduledDate.toISOString(),
          created_at: new Date().toISOString(),
        }

        const { error: insertError } = await (supabase as any)
          .from('notification_queue')
          .insert(queueItem)

        if (insertError) {
          if (insertError.code === '23505') {
            continue
          }
          errors.push(`Failed to queue notification: ${insertError.message}`)
          continue
        }

        queued++

        if (rule.channel === 'whatsapp' && toAddress) {
          try {
            const conversation = await getOrCreateConversation(
              appointment.organization_id,
              toAddress.replace(/\D/g, '')
            )
            await logNotificationEvent({
              organizationId: appointment.organization_id,
              conversationId: conversation.id,
              queueItemId: undefined,
              eventType: 'QUEUED',
              metadata: { trigger, channel: rule.channel, appointmentId },
              traceId,
            })
          } catch (convErr) {
            console.error('[orchestrator] conversation tracking error:', convErr)
          }
        }

        if (delayMinutes === 0 && rule.channel !== 'in_app') {
          const channelAdapter = createChannel(rule.channel, provider.config as Record<string, unknown>)
          if (channelAdapter) {
            const result: SendResult = await channelAdapter.send({
              channel: rule.channel,
              toAddress,
              subject: renderedSubject,
              body: renderedBody,
              appointmentId,
              organizationId: appointment.organization_id,
              idempotencyKey,
              variables,
              metadata: { traceId },
            })

            if (result.success) {
              await (supabase as any)
                .from('notification_queue')
                .update({
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  provider_message_id: result.providerMessageId,
                })
                .eq('idempotency_key', idempotencyKey)
              sent++
              try {
                await logNotificationEvent({
                  organizationId: appointment.organization_id,
                  eventType: 'SENT',
                  metadata: {
                    trigger,
                    channel: rule.channel,
                    appointmentId,
                    providerMessageId: result.providerMessageId,
                  },
                  traceId,
                })
              } catch (logErr) {
                console.error('[orchestrator] event log error:', logErr)
              }
            } else {
              errors.push(`Send failed for ${rule.channel}: ${result.error}`)
            }
          }
        }
      } catch (e) {
        errors.push(`Rule processing error: ${e}`)
      }
    }

    return { success: true, queued, sent, errors, traceId }
  } catch (error) {
    console.error('[NotificationOrchestrator] Error:', error)
    return {
      success: false,
      queued,
      sent,
      errors: [...errors, String(error)],
      traceId,
    }
  }
}

async function fetchAppointment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appointmentId: string
): Promise<AppointmentData | null> {
  const { data } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      organization_id,
      start_time,
      end_time,
      client_id,
      employee_id,
      status,
      confirmation_status,
      clients!inner(name, phone, email, confirmation_method, confirmations_enabled, preferred_contact),
      employees!inner(name, user_id),
      services!inner(name),
      organizations!inner(name, phone, address)
    `)
    .eq('id', appointmentId)
    .single()

  return data || null
}

function getRecipientAddress(
  appointment: AppointmentData,
  channel: NotificationChannel
): string | null {
  switch (channel) {
    case 'whatsapp':
      return appointment.clients?.phone || null
    case 'email':
      return appointment.clients?.email || null
    default:
      return null
  }
}

export async function dispatchConfirmationRequest(
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  return NotificationOrchestrator('confirmation_requested', appointmentId, appointmentData)
}

export async function dispatchAppointmentCreated(
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  return NotificationOrchestrator('appointment_created', appointmentId, appointmentData)
}

export async function dispatchAppointmentReminder(
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  return NotificationOrchestrator('appointment_reminder', appointmentId, appointmentData)
}

export async function dispatchAppointmentCancelled(
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  return NotificationOrchestrator('appointment_cancelled', appointmentId, appointmentData)
}

export async function dispatchAppointmentCompleted(
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  return NotificationOrchestrator('appointment_completed', appointmentId, appointmentData)
}

export async function dispatchAppointmentNoShow(
  appointmentId: string,
  appointmentData?: AppointmentData
): Promise<OrchestratorResult> {
  return NotificationOrchestrator('appointment_no_show', appointmentId, appointmentData)
}