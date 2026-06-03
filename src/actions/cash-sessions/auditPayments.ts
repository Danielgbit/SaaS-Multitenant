'use server'

import { createClient } from '@/lib/supabase/server'

export async function auditPayments() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 1. Total payments
  const { count: totalPayments } = await supabase
    .from('client_account_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_type', 'payment')

  // 2. Sample payments
  const { data: samplePayments } = await supabase
    .from('client_account_transactions')
    .select('id, amount, payment_method, notes, created_at')
    .eq('transaction_type', 'payment')
    .order('created_at', { ascending: false })
    .limit(5)

  // 3. operation_entries with source_type = client_account_payment
  const { data: operationEntries } = await (supabase as any)
    .from('operation_entries')
    .select('id, source_id, source_type, entry_type, amount, entry_status')
    .eq('source_type', 'client_account_payment')
    .limit(5)

  return {
    totalPayments: totalPayments || 0,
    samplePayments: samplePayments || [],
    operationEntriesForPayments: operationEntries || [],
  }
}
