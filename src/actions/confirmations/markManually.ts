'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MarkManuallySchema, type MarkManuallyState } from './schemas'

export async function markManually(
  prevState: MarkManuallyState,
  formData: FormData
): Promise<MarkManuallyState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    reason: formData.get('reason') as string,
  }

  const parsed = MarkManuallySchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointmentId, reason } = parsed.data

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: appointment, error: apptError } = await (supabase as any)
    .from('appointments')
    .select('id, organization_id, employee_id, client_id, confirmation_status, price_adjustment')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  if (appointment.confirmation_status === 'confirmed') {
    return { error: 'Esta cita ya fue confirmada.' }
  }

  const { data: orgMember, error: orgError } = await (supabase as any)
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  if (!['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { error: 'No tienes permiso para marcar citas manualmente.' }
  }

  const now = new Date().toISOString()
  const currentPrice = appointment.price_adjustment || 0

  const { data: log, error: logError } = await (supabase as any)
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'manually_set',
      performed_by: user.id,
      performed_by_role: 'assistant',
      price_before: currentPrice,
      price_after: currentPrice,
      notes: `Marca manual: ${reason}`,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('[markManually] Log error:', logError)
    return { error: 'Error al registrar la acción. Intenta de nuevo.' }
  }

  const { error: updateError } = await (supabase as any)
    .from('appointments')
    .update({
      confirmation_status: 'completed',
      status: 'completed',
      completed_at: now,
      completed_by: user.id,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[markManually] Update error:', updateError)
    return { error: 'Error al marcar la cita. Intenta de nuevo.' }
  }

  // Create appointment_confirmations record so it appears in /confirmations
  const { data: confirmation, error: confError } = await (supabase as any)
    .from('appointment_confirmations')
    .insert({
      organization_id: appointment.organization_id,
      employee_id: appointment.employee_id,
      appointment_id: appointmentId,
      services: [],
      total_amount: currentPrice,
      confirmation_type: 'scheduled',
      status: 'pending_reception',
      employee_confirmed_at: now,
      client_name: null,
      client_phone: null,
      notes: reason ? `Confirmado por admin: ${reason}` : null,
    })
    .select('id')
    .single()

  if (confError) {
    console.error('[markManually] Confirmation insert error:', confError)
    // Don't return error - the appointment was already updated
  }

  // Send service_ready notification to staff
  const { data: orgMembers, error: membersError } = await (supabase as any)
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', appointment.organization_id)
    .in('role', ['owner', 'admin', 'staff'])

  if (!membersError && orgMembers) {
    const notificationEntries = orgMembers.map((member: any) => ({
      organization_id: appointment.organization_id,
      user_id: member.user_id,
      type: 'service_ready',
      title: 'Servicio completado',
      message: 'Un servicio está listo para cobrar. Revisa /confirmations.',
      metadata: {
        appointment_id: appointmentId,
        confirmation_id: confirmation?.id || null
      }
    }))

    await (supabase as any)
      .from('notifications')
      .insert(notificationEntries)
  }

  try {
    // @ts-ignore - revalidateTag typing issue
    revalidateTag(`confirmations-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[markManually] revalidateTag error:', e)
  }
  try {
    // @ts-ignore - revalidateTag typing issue
    revalidateTag(`pending-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[markManually] revalidateTag error:', e)
  }
  try {
    revalidatePath('/payroll')
  } catch (e) {
    console.warn('[markManually] revalidatePath /payroll error:', e)
  }

  return { success: true, logId: log.id }
}
