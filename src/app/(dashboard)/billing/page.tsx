import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlans } from '@/actions/billing/getPlans'
import { getSubscription } from '@/actions/billing/getSubscription'
import { BillingClient } from '@/components/dashboard/billing/BillingClient'

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
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold" style={{ color: '#1A2B32', fontFamily: 'Cormorant Garamond, serif' }}>
            Facturación
          </h1>
          <p style={{ color: '#5A6B70' }} className="mt-2">
            Gestiona tu suscripción y métodos de pago
          </p>
        </header>

        <BillingClient
          plans={plansResult.data as unknown as any}
          subscription={subscriptionResult.success ? subscriptionResult.data as any : null}
          organizationId={organizationId}
        />
      </div>
    </div>
  )
}
