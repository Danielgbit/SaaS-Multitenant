'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ResendInvitationSchema = z.object({
  invitationId: z.string().uuid('ID de invitación inválido'),
})

export async function resendInvitation(
  input: z.infer<typeof ResendInvitationSchema>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const validation = ResendInvitationSchema.safeParse(input)
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
    return { error: 'No tienes permisos para reenviar invitaciones.' }
  }

  const { data: invitation, error: inviteError } = await (supabase as any)
    .from('employee_invitations')
    .select('*, employees(name)')
    .eq('id', invitationId)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (inviteError || !invitation) {
    return { error: 'Invitación no encontrada.' }
  }

  if (invitation.status !== 'pending') {
    return { error: 'Esta invitación ya no está activa.' }
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'Esta invitación ha expirado.' }
  }

  const { data: rateCheck } = await (supabase as any).rpc(
    'can_resend_invitation',
    { p_invitation_id: invitationId }
  )

  if (!rateCheck) {
    return { error: 'Has alcanzado el límite de reenvíos. Intenta más tarde.' }
  }

  const { data: updateResult, error: updateError } = await (supabase as any)
    .from('employee_invitations')
    .update({
      resend_count: invitation.resend_count + 1,
      last_resend_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating invitation:', updateError.message)
    return { error: 'No se pudo reenviar la invitación.' }
  }

  if (invitation.email) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/invite/${invitation.token}`

    await sendResendEmail(
      invitation.email,
      invitation.employees?.name || 'Usuario',
      invitationUrl
    )
  }

  revalidatePath('/employees')
  return { success: true }
}

async function sendResendEmail(to: string, employeeName: string, invitationUrl: string) {
  const { sendEmail } = await import('@/lib/resend')
  
  const subject = 'Te han invitado - Recordatorio'
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Hola ${employeeName},</h1>
      <p>Has recibido un recordatorio de tu invitación.</p>
      <a href="${invitationUrl}" style="display: inline-block; background: #0F4C5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Aceptar invitación
      </a>
      <p>Este enlace expira en 7 días.</p>
    </div>
  `

  try {
    await sendEmail({ to, subject, html })
  } catch (error) {
    console.error('Error sending resend email:', error)
  }
}
