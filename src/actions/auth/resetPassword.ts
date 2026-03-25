'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function resetPassword(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const validation = ResetPasswordSchema.safeParse({ password, confirmPassword })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: { user }, error: getUserError } = await supabase.auth.getUser()

  if (getUserError || !user) {
    return { error: 'Sesión expirada. Por favor solicita un nuevo enlace de recuperación.' }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: validation.data.password,
  })

  if (updateError) {
    console.error('Password update error:', updateError.message)
    return { error: 'No se pudo actualizar la contraseña. Intenta de nuevo.' }
  }

  return { success: true }
}
