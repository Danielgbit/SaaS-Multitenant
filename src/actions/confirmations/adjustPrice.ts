'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AdjustPriceSchema, type AdjustPriceState } from './schemas'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

export async function adjustPrice(
  prevState: AdjustPriceState,
  formData: FormData
): Promise<AdjustPriceState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    newPrice: formData.get('newPrice') ? Number(formData.get('newPrice')) : 0,
    reason: formData.get('reason') as string,
  }

  const parsed = AdjustPriceSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointmentId, newPrice, reason } = parsed.data

  const supabase = await createClient()

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('id, organization_id, price_adjustment, confirmation_status')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  if (appointment.confirmation_status === 'confirmed') {
    return { error: 'No se puede ajustar el precio de una cita ya confirmada.' }
  }

  const access = await requireOrgAccess(appointment.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return { error: access.error }

  const previousPrice = appointment.price_adjustment || 0

  const { data: log, error: logError } = await supabase
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'adjusted',
      performed_by: access.context.userId,
      performed_by_role: 'assistant',
      price_before: previousPrice,
      price_after: newPrice,
      notes: `Ajuste: ${reason}`,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('[adjustPrice] Log error:', logError)
    return { error: 'Error al registrar el ajuste. Intenta de nuevo.' }
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update({ price_adjustment: newPrice })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[adjustPrice] Update error:', updateError)
    return { error: 'Error al ajustar el precio. Intenta de nuevo.' }
  }

  try {
    revalidateTag(`confirmations-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[adjustPrice] revalidateTag error:', e)
  }
  try {
    revalidateTag(`pending-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[adjustPrice] revalidateTag error:', e)
  }

  return { success: true, logId: log.id }
}
