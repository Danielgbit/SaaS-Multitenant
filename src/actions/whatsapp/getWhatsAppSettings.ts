'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const WhatsAppSettingsSchema = z.object({
  organizationId: z.string().uuid(),
})

export async function getWhatsAppSettings(
  organizationId: string
): Promise<{
  success: boolean
  data?: Record<string, unknown> | null
  error?: string
}> {
  const validation = WhatsAppSettingsSchema.safeParse({ organizationId })
  if (!validation.success) {
    return { success: false, error: 'ID de organización inválido' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching WhatsApp settings:', error)
      return { success: false, error: 'Error al obtener configuración' }
    }

    return {
      success: true,
      data: data || null,
    }
  } catch (error) {
    console.error('Error in getWhatsAppSettings:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
