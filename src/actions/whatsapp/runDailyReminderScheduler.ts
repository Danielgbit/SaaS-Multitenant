'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppReminder } from './sendWhatsAppReminder'

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

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const { data: organizations, error: orgsError } = await (supabase as any)
      .from('whatsapp_settings')
      .select('organization_id, enabled, reminder_hours_before')
      .eq('enabled', true)

    if (orgsError || !organizations || organizations.length === 0) {
      return { success: true, processed: 0, sent: 0, failed: 0, errors: [] }
    }

    const orgIds = organizations.map((org: any) => org.organization_id)

    const { data: appointments, error: aptsError } = await (supabase as any)
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

    return {
      success: true,
      processed: appointments.length,
      sent,
      failed,
      errors,
    }
  } catch (error) {
    console.error('Error in runDailyReminderScheduler:', error)
    errors.push(String(error))
    return { success: false, processed: 0, sent, failed, errors }
  }
}
