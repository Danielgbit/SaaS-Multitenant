'use server'

import { createClient } from '@/lib/supabase/server'
import { queueEmailMessage } from './queueEmailMessage'
import { formatCurrencyCOP } from '@/lib/billing/utils'

export async function runEmailReminderScheduler(): Promise<{
  success: boolean
  processed: number
  sent: number
  failed: number
  skippedV2: number
  errors: string[]
}> {
  const supabase = await createClient()

  const errors: string[] = []
  let sent = 0
  let failed = 0
  let skippedV2 = 0

  try {
    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const { data: organizations, error: orgsError } = await supabase
      .from('email_settings')
      .select('organization_id, enabled, reminder_hours_before, send_reminders')
      .eq('enabled', true)
      .eq('send_reminders', true)

    if (orgsError || !organizations || organizations.length === 0) {
      return { success: true, processed: 0, sent: 0, failed: 0, skippedV2: 0, errors: [] }
    }

    const orgIds = organizations.map((org: any) => org.organization_id)

    const { data: settingsList } = await supabase
      .from('booking_settings')
      .select('organization_id, use_notification_v2')
      .in('organization_id', orgIds)

    const v2Orgs = new Set(
      (settingsList || [])
        .filter((s: any) => s.use_notification_v2 === true)
        .map((s: any) => s.organization_id)
    )

    const v1OrgIds = orgIds.filter((id: string) => !v2Orgs.has(id))

    if (v1OrgIds.length === 0) {
      return { success: true, processed: 0, sent: 0, failed: 0, skippedV2: orgIds.length, errors: [] }
    }

    skippedV2 = orgIds.length - v1OrgIds.length

    const { data: appointments, error: aptsError } = await supabase
      .from('appointments')
      .select('id, organization_id, start_time, client_id, employee_id')
      .in('organization_id', v1OrgIds)
      .gte('start_time', tomorrow.toISOString())
      .lte('start_time', tomorrowEnd.toISOString())
      .in('status', ['pending', 'confirmed'])

    if (aptsError || !appointments) {
      errors.push('Error al buscar citas')
      return { success: false, processed: 0, sent: 0, failed: 0, skippedV2: 0, errors }
    }

    for (const apt of appointments) {
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('name, email')
          .eq('id', apt.client_id)
          .single()

        const { data: service } = await supabase
          .from('services')
          .select('name, duration, price')
          .eq('organization_id', apt.organization_id)
          .limit(1)
          .single()

        const { data: employee } = await supabase
          .from('employees')
          .select('name')
          .eq('id', apt.employee_id!)
          .single()

        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', apt.organization_id)
          .single()

        const { data: existingReminder } = await supabase
          .from('email_logs')
          .select('id')
          .eq('appointment_id', apt.id)
          .eq('email_type', 'appointment_reminder')
          .eq('status', 'sent')
          .single()

        if (existingReminder) {
          continue
        }

        if (!client?.email) {
          errors.push(`Cita ${apt.id}: Cliente sin email`)
          failed++
          continue
        }

        const startDate = new Date(apt.start_time)
        const duration = service?.duration || 30

        const result = await queueEmailMessage({
          organizationId: apt.organization_id,
          appointmentId: apt.id,
          clientId: apt.client_id,
          emailType: 'appointment_reminder',
          to: client.email,
          variables: {
            businessName: org?.name || 'Negocio',
            clientName: client.name,
            serviceName: service?.name || 'Servicio',
            employeeName: employee?.name || 'Profesional',
            date: startDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
            time: startDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duration: `${duration} min`,
            price: service?.price ? formatCurrencyCOP(service.price) : undefined,
          },
        })

        if (result.success) {
          sent++
        } else {
          failed++
          errors.push(`Cita ${apt.id}: ${result.error}`)
        }
      } catch (appointmentError) {
        failed++
        errors.push(`Cita ${apt.id}: ${String(appointmentError)}`)
      }
    }

    return {
      success: true,
      processed: appointments.length,
      sent,
      failed,
      skippedV2,
      errors,
    }
  } catch (error) {
    console.error('Error in runEmailReminderScheduler:', error)
    errors.push(String(error))
    return { success: false, processed: 0, sent, failed, skippedV2: 0, errors }
  }
}
