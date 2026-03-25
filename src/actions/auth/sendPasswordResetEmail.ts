'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function sendPasswordResetEmail(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const email = formData.get('email') as string

  const validation = ForgotPasswordSchema.safeParse({ email })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
  })

  if (error) {
    console.error('Password reset error:', error.message)
    return { error: 'No se pudo enviar el email. Intenta de nuevo.' }
  }

  return { success: true }
}
