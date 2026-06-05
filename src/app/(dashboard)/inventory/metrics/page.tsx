import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInventoryMetrics } from '@/lib/metrics/getInventoryMetrics'
import { MetricsClient } from './MetricsClient'

export const metadata = {
  title: 'Métricas de Inventario — SaaS',
}

export default async function MetricsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    redirect('/calendar')
  }

  const metrics = await getInventoryMetrics(orgMember.organization_id)

  return <MetricsClient metrics={metrics} organizationId={orgMember.organization_id} />
}
