import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlans } from '@/actions/billing/getPlans'
import { getSubscription } from '@/actions/billing/getSubscription'
import { BillingClient } from '@/components/dashboard/billing/BillingClient'
import { BillingPageWrapper } from './BillingPageWrapper'

export const metadata = {
  title: 'Facturación | Prügressy',
  description: 'Gestiona tu suscripción y métodos de pago',
}

export default async function BillingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
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

  const organizationId = orgMember.organization_id

  const [plansResult, subscriptionResult] = await Promise.all([
    getPlans(),
    getSubscription(organizationId),
  ])

  return (
    <BillingPageWrapper
      plans={plansResult.data as unknown as any}
      subscription={subscriptionResult.success ? subscriptionResult.data as any : null}
      organizationId={organizationId}
    />
  )
}
