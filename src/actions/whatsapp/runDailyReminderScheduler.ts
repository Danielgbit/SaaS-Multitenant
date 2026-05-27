/**
 * @deprecated V1 pathway
 * TODO post-MVP: migrate to NotificationOrchestrator
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppReminder } from './sendWhatsAppReminder'
import { getWhatsappProviderOrgs } from '@/lib/notifications/providers'
import { appLog } from '@/lib/app-logger'

export async function runDailyReminderScheduler(): Promise<{
  success: boolean
  processed: number
  sent: number
  failed: number
  errors: string[]
}> {
  const supabase = await createClient()

  const errors: string[] = []
  let sent = 0
  let failed = 0

  appLog('info', 'scheduler started', {
    flow: 'runDailyReminderScheduler',
    operation: 'start',
  })

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const orgs = await getWhatsappProviderOrgs()

    if (orgs.length === 0) {
      return { success: true, processed: 0, sent: 0, failed: 0, errors: [] }
    }

    const orgIds = orgs.map((org) => org.organizationId)

    const { data: appointments, error: aptsError } = await supabase
      .from('appointments')
      .select('id')
      .in('organization_id', orgIds)
      .gte('start_time', tomorrow.toISOString())
      .lte('start_time', tomorrowEnd.toISOString())
      .in('status', ['pending', 'confirmed'])

    if (aptsError || !appointments) {
      errors.push('Error al buscar citas')
      return { success: false, processed: 0, sent: 0, failed: 0, errors }
    }

    for (const apt of appointments) {
      const result = await sendWhatsAppReminder({ appointmentId: apt.id })
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`Cita ${apt.id}: ${result.error}`)
      }
    }

    appLog('info', 'scheduler completed', {
      flow: 'runDailyReminderScheduler',
      operation: 'complete',
      processed: appointments.length,
      sent,
      failed,
    })

    return {
      success: true,
      processed: appointments.length,
      sent,
      failed,
      errors,
    }
  } catch (error) {
    appLog('error', 'scheduler failed', {
      flow: 'runDailyReminderScheduler',
      operation: 'execute',
      sent,
      failed,
      error,
    })
    errors.push(String(error))
    return { success: false, processed: 0, sent, failed, errors }
  }
}
