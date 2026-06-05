'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
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

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('id, organization_id, status, confirmation_status, created_at')
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

  const access = await requireOrgAccess(appointment.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return { error: access.error }

  const now = new Date().toISOString()

  // Shadow Mode: capture seed BEFORE mutation
  const shadowSeed = {
    appointmentId,
    observedUpdatedAt: appointment.created_at,
    initialStatus: appointment.status,
    initialConfirmationStatus: appointment.confirmation_status,
    correlationId: crypto.randomUUID(),
  }

  const { error: updateError } = await supabase
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
    revalidateTag(`confirmations-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[cancelConfirmation] revalidateTag error:', e)
  }
  try {
    revalidateTag(`pending-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[cancelConfirmation] revalidateTag error:', e)
  }

  // Shadow Mode: fire-and-forget validation (does not affect production)
  import('@/lib/shadow').catch(() => {})

  return { success: true }
}
