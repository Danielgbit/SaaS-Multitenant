'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendWhatsAppReminder } from './sendWhatsAppReminder'

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

    const { data: settings } = await (supabase as any)
      .from('booking_settings')
      .select('use_notification_v2')
      .eq('organization_id', log.organization_id)
      .single()

    if (settings?.use_notification_v2 === true) {
      const { dispatchAppointmentReminder } = await import('@/lib/notifications/orchestrator')
      const result = await dispatchAppointmentReminder(log.appointment_id)
      if (!result.success) {
        return { success: false, error: result.errors.join('; ') }
      }
      return { success: true }
    }

    return sendWhatsAppReminder({ appointmentId: log.appointment_id })
  } catch (error) {
    console.error('Error in resendWhatsAppReminder:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
