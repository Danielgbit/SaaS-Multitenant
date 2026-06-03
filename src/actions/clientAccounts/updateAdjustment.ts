'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateAdjustmentInput {
  transaction_id: string
  description: string
  reference?: string
}

export async function updateAdjustment(
  organizationId: string,
  input: UpdateAdjustmentInput
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  if (!input.description || input.description.trim().length === 0) {
    return { success: false, error: 'La descripcion es requerida' }
  }

  const { data: transaction, error: fetchError } = await (supabase as any)
    .from('client_account_transactions')
    .select('id, account_id, transaction_type, is_voided, organization_id')
    .eq('id', input.transaction_id)
    .single()

  if (fetchError || !transaction) {
    return { success: false, error: 'Transaccion no encontrada' }
  }

  if (transaction.transaction_type !== 'adjustment') {
    return { success: false, error: 'Solo se pueden editar ajustes' }
  }

  if (transaction.is_voided) {
    return { success: false, error: 'No se pueden editar transacciones anuladas' }
  }

  if (transaction.organization_id !== organizationId) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { success: false, error: 'Sin permiso para editar transacciones' }
  }

  const { error: updateError } = await (supabase as any)
    .from('client_account_transactions')
    .update({
      notes: input.description.trim(),
      payment_reference: input.reference?.trim() || null,
      edited_by: user.id,
      edited_at: new Date().toISOString(),
    })
    .eq('id', input.transaction_id)

  if (updateError) {
    return { success: false, error: 'Error al actualizar: ' + updateError.message }
  }

  revalidatePath('/clients')
  revalidatePath('/caja')

  return { success: true }
}
