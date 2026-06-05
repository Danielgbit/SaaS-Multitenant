'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

interface RecordPaymentInput {
  appointmentId: string
  organizationId: string
  amount: number
  paymentMethod: string
  notes?: string
  clientId: string
}

export async function recordAppointmentPayment(input: RecordPaymentInput) {
  const supabase = await createClient()

  const access = await requireOrgAccess(input.organizationId, ['owner', 'admin', 'staff'])
  if (!access.success) return { error: access.error }

  // Get or create client account
  const { data: existingAccount } = await supabase
    .from('client_accounts')
    .select('id, balance')
    .eq('client_id', input.clientId)
    .single()

  let accountId: string

  if (existingAccount) {
    accountId = existingAccount.id
  } else {
    const { data: newAccount } = await supabase
      .from('client_accounts')
      .insert({
        client_id: input.clientId,
        organization_id: input.organizationId,
        balance: 0,
        total_purchased: 0,
        total_paid: 0,
        credit_limit: 0,
      })
      .select('id')
      .single()

    if (!newAccount) return { error: 'Error al crear cuenta' }
    accountId = newAccount.id
  }

  // Record transaction
  const currentBalance = existingAccount?.balance || 0

  const { error: txError } = await supabase
    .from('client_account_transactions')
    .insert({
      account_id: accountId,
      organization_id: input.organizationId,
      transaction_type: 'payment',
      amount: input.amount,
      balance_after: currentBalance + input.amount,
      payment_method: input.paymentMethod,
      appointment_id: input.appointmentId,
      notes: input.notes || null,
      created_by: access.context.userId,
    })

  if (txError) return { error: 'Error al registrar pago' }

  // Update appointment payment_status (trigger handles the rest)
  await supabase
    .from('appointments')
    .update({ payment_status: 'paid' })
    .eq('id', input.appointmentId)

  revalidatePath('/calendar')
  revalidatePath(`/clients/${input.clientId}`)

  return { success: true }
}
