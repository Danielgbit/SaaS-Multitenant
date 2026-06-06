'use client'

import { CreditCard } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { BillingClient } from '@/components/dashboard/billing/BillingClient'

export function BillingPageWrapper({
  plans,
  subscription,
  organizationId,
}: {
  plans: any[]
  subscription: any
  organizationId: string
}) {
  const COLORS = useThemeColors()
  const isTrial = subscription?.status === 'trial'

  return (
    <div className="space-y-6">
      {/* Header unificado */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Gestión de suscripción
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white font-heading">
                Facturación
              </h1>
              <p className="text-sm mt-1 text-white/80">
                {subscription
                  ? `Plan ${subscription.planName}`
                  : 'Sin suscripción activa'}
              </p>
            </div>
          </div>

          {isTrial && (
            <button
              onClick={() =>
                window.location.replace('/dashboard/facturacion?portal=true')
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.primary,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              Configurar pago
            </button>
          )}
        </div>
      </div>

      <BillingClient
        plans={plans}
        subscription={subscription}
        organizationId={organizationId}
      />
    </div>
  )
}
