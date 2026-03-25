import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientAccounts, getClientAccountsSummary } from '@/actions/clientAccounts'
import { ClientAccountsClient } from '@/components/dashboard/clients/ClientAccountsClient'

export const metadata = {
  title: 'Cuentas por Cobrar | Prügressy',
  description: 'Gestión de cuentas por cobrar a clientes',
}

export default async function ClientAccountsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  const [accountsResult, summaryResult] = await Promise.all([
    getClientAccounts(orgMember.organization_id),
    getClientAccountsSummary(orgMember.organization_id),
  ])

  return (
    <ClientAccountsClient
      accounts={accountsResult.data || []}
      summary={summaryResult.data}
      organizationId={orgMember.organization_id}
      userRole={orgMember.role}
    />
  )
}