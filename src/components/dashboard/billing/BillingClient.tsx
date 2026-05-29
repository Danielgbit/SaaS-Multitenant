'use client'

import { useState } from 'react'
import { CheckCircle2, Shield, Sparkles, ArrowRight, TrendingUp } from 'lucide-react'
import { createCheckoutSession } from '@/actions/billing/createCheckoutSession'
import { PromoCodeInput } from './PromoCodeInput'
import { CurrentPlanCard } from './CurrentPlanCard'
import { PlanCard } from './PlanCard'
import { formatCurrency } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

interface Plan {
  id: string
  name: string
  price: number
  currency?: string
  max_employees: number
  max_services: number
  max_inventory_items: number
  whatsapp_enabled: boolean
  description?: string
  features?: string[]
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
          subscription={subscription}
          organizationId={organizationId}
        />
      )}

      {/* Promo Code */}
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <PromoCodeInput />
      </div>

      {/* Plans Section */}
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-bold mb-1 font-heading"
            style={{ color: COLORS.textPrimary }}
          >
            Elige tu plan
          </h2>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            Sin costos ocultos. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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

    </div>
  )
}


