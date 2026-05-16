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
): Promise<{ success: boolean; error?: string }> {
  console.log('[confirmByReception] Input:', input)

  const parsed = ConfirmReceptionSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[confirmByReception] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { success: false, error: firstError || 'Datos inválidos' }
  }

  const { confirmation_id, organization_id, action, payment_method, notes } = parsed.data

  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado.' }
  }

  // Verificar que el usuario pertenece a la organización
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single()

  if (orgError || !orgMember) {
    return { success: false, error: 'No perteneces a esta organización.' }
  }

  // Verificar que tiene permisos (owner, admin, staff)
  if (!['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { success: false, error: 'No tienes permiso para confirmar pagos.' }
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
      return { success: false, error: 'Acción inválida.' }
  }

  // Obtener la confirmación actual
  const { data: confirmation, error: confError } = await (supabase as any)
    .from('appointment_confirmations')
    .select('appointment_id, status')
    .eq('id', confirmation_id)
    .single()

  if (confError || !confirmation) {
    return { success: false, error: 'Confirmación no encontrada.' }
  }

  // Shadow Mode: capture seed BEFORE mutation (if we have appointment_id)
  let shadowSeed: {
    appointmentId: string
    observedUpdatedAt: string
    initialStatus: string
    initialConfirmationStatus: string
    correlationId: string
  } | null = null
  if (confirmation.appointment_id) {
    const { data: apt } = await (supabase as any)
      .from('appointments')
      .select('created_at, status, confirmation_status')
      .eq('id', confirmation.appointment_id)
      .single()
    if (apt) {
      shadowSeed = {
        appointmentId: confirmation.appointment_id,
        observedUpdatedAt: apt.created_at,
        initialStatus: apt.status,
        initialConfirmationStatus: apt.confirmation_status,
        correlationId: crypto.randomUUID(),
      }
    }
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
    return { success: false, error: 'Error al actualizar. Intenta de nuevo.' }
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

  // Auto-agregar a nómina cuando se completa el pago
  if (action === 'complete' && confirmation.appointment_id) {
    import('@/actions/payroll/addAppointmentToPayroll').then((m) =>
      m.addAppointmentToPayroll(confirmation.appointment_id!).catch((e) => {
        console.error('[confirmByReception] payroll auto-add error:', e)
      })
    )
  }

  // Shadow Mode: fire-and-forget validation (only for 'complete' actions)
  if (shadowSeed && action === 'complete') {
    import('@/lib/shadow').then(({ shadowQueue, runShadowValidation }) => {
      shadowQueue.enqueue(async () => {
        await runShadowValidation(
          {
            command: 'payment:confirm',
            appointmentId: shadowSeed!.appointmentId,
            organizationId: organization_id,
            correlationId: shadowSeed!.correlationId,
            actorId: user.id,
            actorRole: orgMember.role,
            timestamp: new Date().toISOString(),
            payload: {
              payment_method: payment_method ?? null,
              notes: notes ?? null,
            },
          },
          shadowSeed!,
          supabase
        )
      })
    }).catch((e) => {
      console.error('[confirmByReception] shadow import error:', e)
    })
  }

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
