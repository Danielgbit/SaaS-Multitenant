import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DebtsOverview } from '@/components/dashboard/DebtsOverview'

export const metadata = {
  title: 'Deudas | Prügressy',
  description: 'Cuentas por cobrar y préstamos de empleados',
}

export default async function DebtsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  const orgId = orgMember.organization_id

  // Client accounts with balance > 0
  const { data: clientAccounts } = await (supabase as any)
    .from('client_accounts')
    .select(`
      balance,
      total_purchased,
      total_paid,
      credit_limit,
      is_over_limit,
      is_at_warning_threshold,
      client:clients(id, name, phone)
    `)
    .eq('organization_id', orgId)
    .neq('balance', 0)
    .order('balance', { ascending: false })

  // Employee loans pending
  const { data: loanData } = await (supabase as any)
    .from('employee_loans')
    .select(`
      id,
      amount,
      remaining_amount,
      concept,
      status,
      created_at,
      employee:employees(id, name)
    `)
    .eq('organization_id', orgId)
    .in('status', ['pending', 'partial'])
    .order('created_at', { ascending: false })

  return (
    <DebtsOverview
      clientAccounts={clientAccounts || []}
      employeeLoans={loanData || []}
    />
  )
}
