'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateWhatsAppSettingsSchema = z.object({
  organizationId: z.string().uuid(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  apiKey: z.string().optional(),
  enabled: z.boolean().optional(),
  reminderHoursBefore: z.number().min(1).max(168).optional(),
})

export async function updateWhatsAppSettings(
  input: z.infer<typeof UpdateWhatsAppSettingsSchema>
): Promise<{
  success: boolean
  data?: Record<string, unknown>
  error?: string
}> {
  const validation = UpdateWhatsAppSettingsSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { organizationId, webhookUrl, apiKey, enabled, reminderHoursBefore } = validation.data

  const supabase = await createClient()

  try {
    const updateData: Record<string, unknown> = {}
    
    if (webhookUrl !== undefined) {
      updateData.webhook_url = webhookUrl || null
    }
    if (apiKey !== undefined) {
      updateData.api_key = apiKey || null
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled
    }
    if (reminderHoursBefore !== undefined) {
      updateData.reminder_hours_before = reminderHoursBefore
    }

    const { data: existing } = await (supabase as any)
      .from('whatsapp_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single()

    let result
    if (existing) {
      result = await (supabase as any)
        .from('whatsapp_settings')
        .update(updateData)
        .eq('organization_id', organizationId)
        .select()
        .single()
    } else {
      result = await (supabase as any)
        .from('whatsapp_settings')
        .insert({
          organization_id: organizationId,
          ...updateData,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving WhatsApp settings:', result.error)
      return { success: false, error: 'Error al guardar configuración' }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('Error in updateWhatsAppSettings:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
