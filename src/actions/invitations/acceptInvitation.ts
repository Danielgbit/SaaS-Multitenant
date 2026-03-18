'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function acceptInvitation(token: string): Promise<{ success?: boolean; error?: string }> {
  if (!token || typeof token !== 'string') {
    return { error: 'Token inválido.' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Debes iniciar sesión para aceptar la invitación.' }
  }

  const { data: invitation, error: inviteError } = await (supabase as any)
    .from('employee_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invitation) {
    return { error: 'Invitación no encontrada.' }
  }

  if (invitation.status !== 'pending') {
    return { error: `Esta invitación ya ha sido ${invitation.status === 'accepted' ? 'aceptada' : 'cancelada'}.` }
  }

  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    return { error: 'Esta invitación ha expirado.' }
  }

  const { data: existingMember, error: memberError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { error: 'Ya eres miembro de esta organización.' }
  }

  const { error: updateEmployeeError } = await supabase
    .from('employees')
    .update({ user_id: user.id })
    .eq('id', invitation.employee_id)

  if (updateEmployeeError) {
    console.error('Error updating employee:', updateEmployeeError.message)
    return { error: 'No se pudo vincular tu cuenta.' }
  }

  const { error: insertMemberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (insertMemberError) {
    console.error('Error creating member:', insertMemberError.message)
    await supabase
      .from('employees')
      .update({ user_id: null })
      .eq('id', invitation.employee_id)
    return { error: 'No se pudo crear la membresía.' }
  }

  const { error: updateInviteError } = await (supabase as any)
    .from('employee_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  if (updateInviteError) {
    console.error('Error updating invitation:', updateInviteError.message)
  }

  revalidatePath('/employees')
  revalidatePath('/calendar')
  
  return { success: true }
}
