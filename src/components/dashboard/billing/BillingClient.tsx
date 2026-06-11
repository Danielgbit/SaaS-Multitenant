'use client'

import { useState } from 'react'
import { CheckCircle2, Shield, Sparkles, ArrowRight, TrendingUp } from 'lucide-react'
import { createCheckoutSession } from '@/actions/billing/createCheckoutSession'
import { PromoCodeInput } from './PromoCodeInput'
import { CurrentPlanCard } from './CurrentPlanCard'
import { PlanCard } from './PlanCard'
import { formatCurrency } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Database } from '@/../types/supabase'

type DbPlan = Database['public']['Tables']['plans']['Row']

interface Plan {
  id: string
  name: string
  price: number
  features?: string[]
  max_employees: number
  max_services: number
  max_inventory_items: number
  whatsapp_enabled: boolean
  description?: string
}

interface Subscription {
  id: string
  status: string
  trial_ends_at: string | null
  planName: string
  planPrice: number
  planCurrency?: string
  planWhatsApp: boolean
  isActive: boolean
  cancelAtPeriodEnd: boolean
}

interface BillingClientProps {
  plans: Plan[]
  subscription: Subscription | null
  organizationId: string
}

export function BillingClient({
  plans,
  subscription,
  organizationId,
}: BillingClientProps) {
  const COLORS = useThemeColors()
  const handleUpgrade = async (planId: string) => {
    const result = await createCheckoutSession({ planId, organizationId })
    if (result.success && result.url) {
      window.location.replace(result.url)
    }
  }

  const isTrial = subscription?.status === 'trial'

  const getEmployeeLabel = (max: number) =>
    max === -1 ? 'Ilimitados' : max.toString()
  const getServiceLabel = (max: number) =>
    max === -1 ? 'Ilimitados' : max.toString()
  const getInventoryLabel = (max: number) =>
    max === -1 ? 'Ilimitado' : max.toString()

  return (
    <div className="space-y-10">
      {subscription && (
        <CurrentPlanCard
          plan={{
            id: subscription.id,
            name: subscription.planName,
            price: subscription.planPrice,
            currency: subscription.planCurrency || null,
            description: null,
            features: null,
            max_credit_clients: -1,
            max_employees: -1,
            max_inventory_items: -1,
            max_services: -1,
            stripe_price_id: null,
            whatsapp_enabled: subscription.planWhatsApp,
          } satisfies DbPlan}
          currentPlanId={subscription.id}
          isCurrent={true}
          onSelect={() => {}}
        />
      )}

      {/* Promo Code */}
      {isTrial && (
        <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-sm border border-[#E2E8F0] dark:border-[#1E293B] p-6">
          <PromoCodeInput />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscription?.planName === plan.name}
            isTrial={isTrial}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>
    </div>
  )
}
