import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientAccountDetail } from '@/actions/clientAccounts/getClientAccountDetail'
import { getInventoryProducts } from '@/actions/clientAccounts/getInventoryProducts'
import { ClientAccountDetailClient } from '@/components/dashboard/clients/ClientAccountDetailClient'

export const metadata = {
  title: 'Cuenta del Cliente | Prügressy',
  description: 'Detalle de cuenta por cobrar del cliente',
}

export default async function ClientAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const clientId = resolvedParams.id

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  const [accountResult, productsResult] = await Promise.all([
    getClientAccountDetail(clientId, orgMember.organization_id),
    getInventoryProducts(orgMember.organization_id),
  ])

  if (!accountResult.success) {
    redirect('/clients/accounts')
  }

  return (
    <ClientAccountDetailClient
      client={accountResult.data!.client}
      account={accountResult.data!.account}
      transactions={accountResult.data!.transactions}
      products={productsResult.data || []}
      organizationId={orgMember.organization_id}
      userRole={orgMember.role}
    />
  )
}