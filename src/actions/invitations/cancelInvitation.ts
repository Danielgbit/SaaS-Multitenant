'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CancelInvitationSchema = z.object({
  invitationId: z.string().uuid('ID de invitación inválido'),
})

export async function cancelInvitation(
  input: z.infer<typeof CancelInvitationSchema>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const validation = CancelInvitationSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message }
  }

  const { invitationId } = validation.data

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización.' }
  }

  if (!['owner', 'admin'].includes(orgMember.role)) {
    return { error: 'No tienes permisos para cancelar invitaciones.' }
  }

  const { data: invitation, error: inviteError } = await (supabase as any)
    .from('employee_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (inviteError || !invitation) {
    return { error: 'Invitación no encontrada.' }
  }

  if (invitation.status !== 'pending') {
    return { error: 'Esta invitación ya no está activa.' }
  }

  const { error: updateError } = await (supabase as any)
    .from('employee_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  if (updateError) {
    console.error('Error cancelling invitation:', updateError.message)
    return { error: 'No se pudo cancelar la invitación.' }
  }

  revalidatePath('/employees')
  return { success: true }
}
