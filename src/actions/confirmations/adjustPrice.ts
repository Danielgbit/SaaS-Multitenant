'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AdjustPriceSchema, type AdjustPriceState } from './schemas'

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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: appointment, error: apptError } = await (supabase as any)
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
    return { error: 'No tienes permiso para ajustar precios.' }
  }

  const previousPrice = appointment.price_adjustment || 0

  const { data: log, error: logError } = await (supabase as any)
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'adjusted',
      performed_by: user.id,
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

  const { error: updateError } = await (supabase as any)
    .from('appointments')
    .update({ price_adjustment: newPrice })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[adjustPrice] Update error:', updateError)
    return { error: 'Error al ajustar el precio. Intenta de nuevo.' }
  }

  try {
    // @ts-ignore
    revalidateTag(`confirmations-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[adjustPrice] revalidateTag error:', e)
  }
  try {
    // @ts-ignore
    revalidateTag(`pending-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[adjustPrice] revalidateTag error:', e)
  }

  return { success: true, logId: log.id }
}
