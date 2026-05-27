'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { devLog } from '@/lib/logger'

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
  const parsed = ConfirmReceptionSchema.safeParse(input)

  if (!parsed.success) {
    devLog('[confirmByReception] Validation failed:', parsed.error.issues)
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
  const { data: confirmation, error: confError } = await supabase
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
    const { data: apt } = await supabase
      .from('appointments')
      .select('created_at, status, confirmation_status')
      .eq('id', confirmation.appointment_id)
      .single()
    if (apt) {
      shadowSeed = {
        appointmentId: confirmation.appointment_id,
        observedUpdatedAt: apt.created_at,
        initialStatus: apt.status,
        initialConfirmationStatus: apt.confirmation_status!,
        correlationId: crypto.randomUUID(),
      }
    }
  }

  // Actualizar confirmación
  const { error: updateError } = await supabase
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

  // Auto-registrar transacción financiera si hay payment_method
  if (action === 'complete' && payment_method && confirmation.appointment_id) {
    try {
      const { data: apt } = await supabase
        .from('appointments')
        .select('client_id, organization_id')
        .eq('id', confirmation.appointment_id)
        .single()

      if (apt?.client_id) {
        const { data: account } = await supabase
          .from('client_accounts')
          .select('id, balance')
          .eq('client_id', apt.client_id)
          .single()

        const accountId = account?.id
        const currentBalance = account?.balance || 0

        if (accountId) {
          await supabase.from('client_account_transactions').insert({
            account_id: accountId,
            organization_id: apt.organization_id,
            transaction_type: 'payment',
            amount: confirmation.total_amount || 0,
            balance_after: currentBalance + (confirmation.total_amount || 0),
            payment_method: payment_method,
            appointment_id: confirmation.appointment_id,
            notes: notes || null,
            created_by: confirmation.employee_id,
          })
        }
      }
    } catch (e) {
      console.error('[confirmByReception] financial auto-add error:', e)
    }
  }

  // Auto-agregar a nómina cuando se completa el pago
  if (action === 'complete' && confirmation.appointment_id) {
    import('@/actions/payroll/addAppointmentToPayroll').then((m) =>
      m.addAppointmentToPayroll(confirmation.appointment_id!).catch((e) => {
        console.error('[confirmByReception] payroll auto-add error:', e)
      })
    )
  }

  // Shadow Mode: fire-and-forget validation
  if (shadowSeed) {
    if (action === 'complete') {
      import('@/lib/shadow').catch(() => {})
    } else if (action === 'not_performed') {
      import('@/lib/shadow').catch(() => {})
    }
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
