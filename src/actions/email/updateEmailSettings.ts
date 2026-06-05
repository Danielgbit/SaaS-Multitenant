'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const UpdateEmailSettingsSchema = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
  enabled: z.boolean().optional(),
  reminderHoursBefore: z.number().min(1).max(168).optional(),
  sendConfirmation: z.boolean().optional(),
  sendReminders: z.boolean().optional(),
  sendPostAppointment: z.boolean().optional(),
})

export async function updateEmailSettings(
  data: z.infer<typeof UpdateEmailSettingsSchema>
): Promise<{ success: boolean; error?: string }> {
  const validation = UpdateEmailSettingsSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const { organizationId, enabled, reminderHoursBefore, sendConfirmation, sendReminders, sendPostAppointment } = validation.data

  const supabase = await createClient()

  const access = await requireOrgAccess(organizationId)
  if (!access.success) return access

  const updateData: Record<string, unknown> = {}

  if (enabled !== undefined) {
    updateData.enabled = enabled
  }
  if (reminderHoursBefore !== undefined) {
    updateData.reminder_hours_before = reminderHoursBefore
  }
  if (sendConfirmation !== undefined) {
    updateData.send_confirmation = sendConfirmation
  }
  if (sendReminders !== undefined) {
    updateData.send_reminders = sendReminders
  }
  if (sendPostAppointment !== undefined) {
    updateData.send_post_appointment = sendPostAppointment
  }

  try {
    const { error: upsertError } = await supabase
      .from('email_settings')
      .upsert(
        { organization_id: organizationId, ...updateData },
        { onConflict: 'organization_id' }
      )

    if (upsertError) {
      console.error('Error updating email settings:', upsertError)
      return { success: false, error: 'Error al guardar configuración.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateEmailSettings:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
