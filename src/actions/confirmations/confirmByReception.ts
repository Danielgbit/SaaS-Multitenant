'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ConfirmReceptionSchema = z.object({
  confirmation_id: z.string().uuid('ID de confirmación inválido'),
  organization_id: z.string().uuid('ID de organización inválido'),
  action: z.enum(['complete', 'no_show', 'not_performed']),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
})

export async function confirmByReception(
  input: z.infer<typeof ConfirmReceptionSchema>
): Promise<{ error?: string; success?: boolean }> {
  console.log('[confirmByReception] Input:', input)

  const parsed = ConfirmReceptionSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[confirmByReception] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { confirmation_id, organization_id, action, payment_method, notes } = parsed.data

  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // Verificar que el usuario pertenece a la organización
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  // Verificar que tiene permisos (owner, admin, staff)
  if (!['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { error: 'No tienes permiso para confirmar pagos.' }
  }

  // Determinar status final
  let newStatus: string
  switch (action) {
    case 'complete':
      newStatus = 'completed'
      break
    case 'no_show':
      newStatus = 'no_show'
      break
    case 'not_performed':
      newStatus = 'not_performed'
      break
    default:
      return { error: 'Acción inválida.' }
  }

  // Obtener la confirmación actual
  const { data: confirmation, error: confError } = await (supabase as any)
    .from('appointment_confirmations')
    .select('appointment_id, status')
    .eq('id', confirmation_id)
    .single()

  if (confError || !confirmation) {
    return { error: 'Confirmación no encontrada.' }
  }

  // Actualizar confirmación
  const { error: updateError } = await (supabase as any)
    .from('appointment_confirmations')
    .update({
      status: newStatus,
      reception_confirmed_at: new Date().toISOString(),
      payment_method: payment_method || null,
      notes: notes || null,
    })
    .eq('id', confirmation_id)

  if (updateError) {
    console.error('[confirmByReception] Update error:', updateError)
    return { error: 'Error al actualizar. Intenta de nuevo.' }
  }

  // Si hay appointment_id, actualizar el status de la cita según la acción
  if (confirmation.appointment_id) {
    if (action === 'complete') {
      await supabase
        .from('appointments')
        .update({
          status: 'completed',
          confirmation_status: 'completed',
        })
        .eq('id', confirmation.appointment_id)
    } else if (action === 'no_show') {
      await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', confirmation.appointment_id)
    } else if (action === 'not_performed') {
      await supabase
        .from('appointments')
        .update({ status: 'canceled' })
        .eq('id', confirmation.appointment_id)
    }
  }

  console.log('[confirmByReception] Confirmation updated:', confirmation_id, 'to', newStatus)

  // Revalidar paths
  revalidatePath('/dashboard/confirmations/reception')
  revalidatePath('/dashboard/confirmations/employee')
  revalidatePath('/dashboard/my-services')
  revalidatePath('/payroll')

  return { success: true }
}

export type ConfirmReceptionFormState = {
  success: boolean
  error?: string
}

export async function confirmByReceptionForm(
  prevState: ConfirmReceptionFormState,
  formData: FormData
): Promise<ConfirmReceptionFormState> {
  try {
    const input = {
      confirmation_id: formData.get('confirmation_id') as string,
      organization_id: formData.get('organization_id') as string,
      action: formData.get('action') as 'complete' | 'no_show' | 'not_performed',
      payment_method: formData.get('payment_method') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    const result = await confirmByReception(input)

    if (result.error) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (e) {
    console.error('[confirmByReceptionForm] Error:', e)
    return { success: false, error: 'Error al procesar la solicitud.' }
  }
}
