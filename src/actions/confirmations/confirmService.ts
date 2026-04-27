'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ConfirmServiceSchema, type ConfirmServiceState } from './schemas'

export async function confirmService(
  prevState: ConfirmServiceState,
  formData: FormData
): Promise<ConfirmServiceState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    logId: (formData.get('logId') as string | undefined) ?? undefined,
    paymentMethod: formData.get('paymentMethod') as string,
    notes: (formData.get('notes') as string | undefined) ?? undefined,
  }

  const parsed = ConfirmServiceSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointmentId, logId, paymentMethod, notes } = parsed.data

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: appointment, error: apptError } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      organization_id,
      confirmation_status,
      completed_at,
      completed_by,
      price_adjustment,
      employee_id
    `)
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  if (appointment.confirmation_status === 'confirmed') {
    return { error: 'Esta cita ya fue confirmada.' }
  }

  if (appointment.confirmation_status === 'scheduled') {
    return { error: 'Esta cita aún no fue marcada por el empleado.' }
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
    return { error: 'No tienes permiso para confirmar cobros.' }
  }

  const now = new Date().toISOString()
  const currentPrice = appointment.price_adjustment || 0

  const { data: newLog, error: logError } = await (supabase as any)
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'confirmed',
      performed_by: user.id,
      performed_by_role: 'assistant',
      price_before: currentPrice,
      price_after: currentPrice,
      payment_method: paymentMethod,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('[confirmService] Log error:', logError)
    return { error: 'Error al registrar la confirmación. Intenta de nuevo.' }
  }

  const { error: updateError } = await (supabase as any)
    .from('appointments')
    .update({
      confirmation_status: 'confirmed',
      confirmed_at: now,
      confirmed_by: user.id,
      payment_method: paymentMethod,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[confirmService] Update error:', updateError)
    return { error: 'Error al confirmar la cita. Intenta de nuevo.' }
  }

  if (appointment.completed_by) {
    await (supabase as any)
      .from('notifications')
      .insert({
        organization_id: appointment.organization_id,
        user_id: appointment.completed_by,
        type: 'confirmation_sent',
        title: 'Cobro confirmado',
        message: `Tu servicio fue cobrado exitosamente`,
        metadata: {
          appointment_id: appointmentId,
          log_id: newLog.id,
          payment_method: paymentMethod,
        },
      })
  }

  try {
    // @ts-ignore
    revalidateTag(`confirmations-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[confirmService] revalidateTag error:', e)
  }
  try {
    // @ts-ignore
    revalidateTag(`pending-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[confirmService] revalidateTag error:', e)
  }

  return { success: true, appointmentId }
}
