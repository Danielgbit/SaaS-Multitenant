'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CancelConfirmationSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  reason: z.string().optional(),
})

type CancelConfirmationState = {
  error?: string
  success?: boolean
}

export async function cancelConfirmation(
  prevState: CancelConfirmationState,
  formData: FormData
): Promise<CancelConfirmationState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    reason: formData.get('reason') as string,
  }

  const parsed = CancelConfirmationSchema.safeParse(rawData)

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
    .select('id, organization_id, confirmation_status')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  if (appointment.confirmation_status === 'confirmed') {
    return { error: 'Esta cita ya fue confirmada y no se puede cancelar.' }
  }

  if (appointment.confirmation_status === 'cancelled') {
    return { error: 'Esta cita ya fue cancelada.' }
  }

  const { data: orgMember } = await (supabase as any)
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { error: 'No tienes permisos para cancelar esta cita.' }
  }

  const now = new Date().toISOString()

  const { error: updateError } = await (supabase as any)
    .from('appointments')
    .update({
      confirmation_status: 'cancelled',
      status: 'cancelled',
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[cancelConfirmation] Update error:', updateError)
    return { error: 'Error al cancelar la cita. Intenta de nuevo.' }
  }

  try {
    // @ts-ignore
    revalidateTag(`confirmations-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[cancelConfirmation] revalidateTag error:', e)
  }
  try {
    // @ts-ignore
    revalidateTag(`pending-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[cancelConfirmation] revalidateTag error:', e)
  }

  return { success: true }
}
