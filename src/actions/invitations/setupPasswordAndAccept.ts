'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SetupSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function setupPasswordAndAccept(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const validation = SetupSchema.safeParse({ token, password, confirmPassword })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const supabaseAdmin = await createServiceRoleClient()

  const { data: invitation, error: inviteError } = await (supabase as any)
    .from('employee_invitations')
    .select('*, employees(name), organizations(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invitation) {
    return { error: 'Invitación no encontrada o ya fue aceptada.' }
  }

  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    return { error: 'Esta invitación ha expirado. Solicita una nueva a tu administrador.' }
  }

  let user: { id: string } | null = null

  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
  const foundUser = existingUser?.users.find(u => u.email === invitation.email)

  if (foundUser) {
    user = { id: foundUser.id }
  } else {
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: validation.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.employees?.name || 'Usuario',
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered') ||
        signUpError.message.includes('already exists') ||
        signUpError.code === 'user_already_exists') {
        return { error: 'Este correo ya está registrado. Por favor inicia sesión.' }
      }
      return { error: signUpError.message }
    }

    user = authData?.user
  }

  if (!user) {
    return { error: 'No se pudo crear o encontrar la cuenta. Intenta de nuevo.' }
  }

  const { error: updateEmployeeError } = await supabase
    .from('employees')
    .update({ user_id: user.id })
    .eq('id', invitation.employee_id)

  if (updateEmployeeError) {
    console.error('Error linking employee:', updateEmployeeError.message)
    try {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    } catch (e) {
      console.error('Rollback failed:', e)
    }
    return { error: 'No se pudo vincular tu cuenta. Intenta de nuevo.' }
  }

  const { error: insertMemberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (insertMemberError) {
    console.error('Error creating member:', insertMemberError.message)
    try {
      await supabaseAdmin.from('employees').update({ user_id: null }).eq('id', invitation.employee_id)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    } catch (e) {
      console.error('Rollback failed:', e)
    }
    return { error: 'No se pudo crear la membresía. Intenta de nuevo.' }
  }

  await (supabase as any)
    .from('employee_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  revalidatePath('/employees')
  revalidatePath('/calendar')
  revalidatePath('/dashboard')

  return { success: true }
}