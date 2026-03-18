'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const RevokeAccessSchema = z.object({
  employeeId: z.string().uuid('ID de empleado inválido'),
})

export async function revokeAccess(
  input: z.infer<typeof RevokeAccessSchema>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const validation = RevokeAccessSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message }
  }

  const { employeeId } = validation.data

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

  if (orgMember.role !== 'owner') {
    return { error: 'Solo el owner puede revocar acceso.' }
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, name, user_id, organization_id')
    .eq('id', employeeId)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (employeeError || !employee) {
    return { error: 'Empleado no encontrado.' }
  }

  if (!employee.user_id) {
    return { error: 'Este empleado no tiene acceso al sistema.' }
  }

  const { data: memberToRemove, error: memberError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgMember.organization_id)
    .eq('user_id', employee.user_id)
    .single()

  if (memberError || !memberToRemove) {
    console.error('Member not found for removal')
  } else {
    const { error: deleteMemberError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberToRemove.id)

    if (deleteMemberError) {
      console.error('Error deleting member:', deleteMemberError.message)
    }
  }

  const { error: updateEmployeeError } = await supabase
    .from('employees')
    .update({ user_id: null })
    .eq('id', employeeId)

  if (updateEmployeeError) {
    console.error('Error revoking access:', updateEmployeeError.message)
    return { error: 'No se pudo revocar el acceso.' }
  }

  await (supabase as any)
    .from('employee_invitations')
    .update({ status: 'cancelled' })
    .eq('employee_id', employeeId)
    .eq('status', 'pending')

  const { data: userData } = await supabase.auth.admin.getUserById(employee.user_id)
  const userEmail = userData?.user?.email

  if (userEmail) {
    await sendRevokeNotification(userEmail, employee.name, orgMember.organization_id)
  }

  revalidatePath('/employees')
  return { success: true }
}

async function sendRevokeNotification(
  to: string,
  employeeName: string,
  organizationId: string
) {
  const supabase = await createClient()

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  const orgName = organization?.name || 'la organización'

  const { sendEmail } = await import('@/lib/resend')
  
  const subject = 'Tu acceso ha sido revocado'
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Hola ${employeeName},</h1>
      <p>Tu acceso a <strong>${orgName}</strong> ha sido revocado.</p>
      <p>Si crees que esto es un error, contacta al administrador de la organización.</p>
    </div>
  `

  try {
    await sendEmail({ to, subject, html })
  } catch (error) {
    console.error('Error sending revoke notification:', error)
  }
}
