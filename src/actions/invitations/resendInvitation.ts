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
  
  const subject = 'Te han invitado - Recordatorio de invitacion'
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recordatorio de invitacion</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 40px rgba(15, 76, 92, 0.12);">
        <div style="background: linear-gradient(135deg, #0F4C5C 0%, #0a3d4a 50%, #062c38 100%); padding: 48px 40px; text-align: center;">
          <h1 style="font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -1px; margin: 0;">Prügressy<span style="color: #5eead4;">.</span></h1>
          <p style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin-top: 8px;">Recordatorio de invitacion</p>
        </div>
        <div style="padding: 48px 40px;">
          <p style="font-size: 20px; color: #0f172a; margin-bottom: 16px; font-weight: 600;">Hola ${employeeName},</p>
          <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.7;">Has recibido un recordatorio de tu invitacion. Acepta la invitacion haciendo clic en el boton de abajo.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #0F4C5C 0%, #0a3d4a 100%); color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(15, 76, 92, 0.4);">
              Aceptar invitacion
            </a>
          </div>
          
          <div style="margin-top: 28px; padding: 16px 20px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <p style="font-size: 13px; color: #92400e; font-weight: 500; margin: 0;">Este enlace expira en 7 dias. Si no solicitaste esta invitacion, puedes ignorar este correo.</p>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 16px; font-weight: 700; color: #0F4C5C; margin-bottom: 8px;">Prügressy</p>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 4px;">¿Tienes alguna pregunta?</p>
          <p style="font-size: 13px; color: #64748b;"><a href="mailto:soporte@prugressy.com" style="color: #0F4C5C; text-decoration: none; font-weight: 500;">Contactanos</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail({ to, subject, html })
  } catch (error) {
    console.error('Error sending resend email:', error)
  }
}
