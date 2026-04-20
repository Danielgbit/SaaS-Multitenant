'use server'

import { revalidateTag } from 'next/cache'
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
    .select('id, organization_id, confirmation_status, price_adjustment')
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
      completed_at: now,
      completed_by: user.id,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[markManually] Update error:', updateError)
    return { error: 'Error al marcar la cita. Intenta de nuevo.' }
  }

  try {
    // @ts-ignore
    revalidateTag(`confirmations-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[markManually] revalidateTag error:', e)
  }
  try {
    // @ts-ignore
    revalidateTag(`pending-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[markManually] revalidateTag error:', e)
  }

  return { success: true, logId: log.id }
}
