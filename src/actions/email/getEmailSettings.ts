'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const GetEmailSettingsSchema = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
})

export async function getEmailSettings(
  organizationId: string
): Promise<{
  success: boolean
  data?: Record<string, unknown> | null
  error?: string
}> {
  const parsed = GetEmailSettingsSchema.safeParse({ organizationId })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado.' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!orgMember) {
    return { success: false, error: 'No perteneces a esta organización.' }
  }

  try {
    const { data: settings, error: settingsError } = await (supabase as any)
      .from('email_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching email settings:', settingsError)
      return { success: false, error: 'Error al obtener configuración.' }
    }

    if (!settings) {
      const { data: newSettings, error: createError } = await (supabase as any)
        .from('email_settings')
        .insert({ organization_id: organizationId })
        .select()
        .single()

      if (createError) {
        console.error('Error creating email settings:', createError)
        return { success: false, error: 'Error al crear configuración.' }
      }

      return { success: true, data: newSettings }
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error in getEmailSettings:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
