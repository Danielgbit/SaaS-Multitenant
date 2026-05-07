'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Loader2,
  Zap,
  X,
  Star,
  Shield,
  Sparkles,
  ArrowRight,
  Crown,
  Gift,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { createCheckoutSession } from '@/actions/billing/createCheckoutSession'
import { cancelSubscription } from '@/actions/billing/cancelSubscription'
import { reactivateSubscription } from '@/actions/billing/reactivateSubscription'
import { PromoCodeInput } from './PromoCodeInput'
import { formatCurrency, getTrialDaysRemaining } from '@/lib/billing/utils'
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
  const [mounted, setMounted] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCancel = async () => {
    setIsCancelling(true)
    await cancelSubscription({ organizationId })
    setShowCancelModal(false)
    setIsCancelling(false)
    window.location.reload()
  }

  const handleUpgrade = async (planId: string) => {
    const result = await createCheckoutSession({ planId, organizationId })
    if (result.success && result.url) {
      window.location.replace(result.url)
    }
  }

  const isTrial = subscription?.status === 'trial'
  const trialDays = subscription?.trial_ends_at
    ? getTrialDaysRemaining(subscription.trial_ends_at)
    : 0
  const currency = subscription?.planCurrency || 'COP'

  const getEmployeeLabel = (max: number) =>
    max === -1 ? 'Ilimitados' : max.toString()
  const getServiceLabel = (max: number) =>
    max === -1 ? 'Ilimitados' : max.toString()
  const getInventoryLabel = (max: number) =>
    max === -1 ? 'Ilimitado' : max.toString()

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLORS.primary }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Current Plan Card */}
      {subscription && (
        <div
          className="rounded-2xl border p-6 md:p-8"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Plan info */}
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: isTrial
                    ? `${COLORS.amber}15`
                    : `${COLORS.primary}10`,
                  border: `1px solid ${
                    isTrial ? COLORS.amber + '20' : COLORS.primary + '15'
                  }`,
                }}
              >
                {isTrial ? (
                  <Clock className="w-6 h-6" style={{ color: COLORS.amber }} />
                ) : (
                  <Crown className="w-6 h-6" style={{ color: COLORS.primary }} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2
                    className="text-xl font-bold"
                    style={{
                      color: COLORS.textPrimary,
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {subscription.planName}
                  </h2>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: isTrial
                        ? COLORS.warningLight
                        : COLORS.successLight,
                      color: isTrial ? COLORS.warning : COLORS.success,
                      border: `1px solid ${
                        isTrial ? COLORS.warning + '20' : COLORS.success + '20'
                      }`,
                    }}
                  >
                    {subscription.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activo
                      </>
                    ) : subscription.status === 'trial' ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Prueba gratis
                      </>
                    ) : (
                      subscription.status
                    )}
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {isTrial
                    ? `${trialDays} días restantes en tu período de prueba`
                    : `${formatCurrency(
                        subscription.planPrice,
                        currency
                      )}/mes · Renovación mensual`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {!isTrial && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer"
                  style={{
                    color: COLORS.error,
                    border: `1px solid ${COLORS.error}20`,
                    backgroundColor: 'transparent',
                  }}
                >
                  Cancelar plan
                </button>
              )}
              {!isTrial && (
                <button
                  onClick={() =>
                    window.location.replace('/dashboard/billing?portal=true')
                  }
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer"
                  style={{
                    color: COLORS.primary,
                    border: `1px solid ${COLORS.primary}20`,
                    backgroundColor: 'transparent',
                  }}
                >
                  Métodos de pago
                </button>
              )}
              {isTrial && (
                <button
                  onClick={() =>
                    window.location.replace('/dashboard/billing?portal=true')
                  }
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                  style={{
                    background: COLORS.primaryGradient,
                    color: '#FFFFFF',
                  }}
                >
                  Configurar pago
                </button>
              )}
            </div>
          </div>

          {/* Trial banner */}
          {isTrial && (
            <div
              className="mt-6 p-4 rounded-xl flex items-start gap-3"
              style={{
                backgroundColor: COLORS.warningLight,
                border: `1px solid ${COLORS.warning}20`,
              }}
            >
              <Gift
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: COLORS.warning }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: COLORS.textPrimary }}
                >
                  Disfruta de todas las funcionalidades
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: COLORS.textSecondary }}
                >
                  Tu período de prueba esta activo. Al finalizar, elige el plan
                  que mejor se adapte a tu negocio.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation banner */}
          {!isTrial && subscription.cancelAtPeriodEnd && (
            <div
              className="mt-6 p-4 rounded-xl flex items-start gap-3"
              style={{
                backgroundColor: COLORS.errorLight,
                border: `1px solid ${COLORS.error}20`,
              }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: COLORS.error }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: COLORS.textPrimary }}
                >
                  Tu suscripción se cancelara al final del período
                </p>
                <p
                  className="text-xs mt-0.5 mb-3"
                  style={{ color: COLORS.textSecondary }}
                >
                  Puedes reactivarla en cualquier momento sin perder tu
                  información.
                </p>
                <button
                  onClick={async () => {
                    await reactivateSubscription({ organizationId })
                    window.location.reload()
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: COLORS.primaryGradient,
                    color: '#FFFFFF',
                  }}
                >
                  Reactivar suscripción
                </button>
              </div>
            </div>
          )}
        </div>
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
            className="text-2xl font-bold mb-1"
            style={{
              color: COLORS.textPrimary,
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            Elige tu plan
          </h2>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            Sin costos ocultos. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.planName === plan.name
            const isPopular =
              plan.name === 'Profesional' || plan.name === 'Premium'

            return (
              <div
                key={plan.id}
                className="rounded-2xl border p-6 md:p-8 transition-all duration-200"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: isCurrentPlan ? COLORS.primary : COLORS.border,
                  boxShadow: isCurrentPlan
                    ? `0 0 0 1px ${COLORS.primary}`
                    : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: isPopular
                          ? `${COLORS.primary}10`
                          : `${COLORS.primary}08`,
                        border: `1px solid ${
                          isPopular
                            ? COLORS.primary + '15'
                            : COLORS.border
                        }`,
                      }}
                    >
                      {plan.name === 'Basico' ? (
                        <Shield
                          className="w-5 h-5"
                          style={{ color: COLORS.primary }}
                        />
                      ) : (
                        <Sparkles
                          className="w-5 h-5"
                          style={{ color: COLORS.primary }}
                        />
                      )}
                    </div>
                    <div>
                      <h3
                        className="text-lg font-bold"
                        style={{
                          color: COLORS.textPrimary,
                          fontFamily: "'Cormorant Garamond', serif",
                        }}
                      >
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  {isPopular && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: COLORS.amberLight,
                        color: COLORS.amber,
                        border: `1px solid ${COLORS.amber}20`,
                      }}
                    >
                      <Star className="w-3 h-3 fill-amber-500" />
                      Recomendado
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span
                    className="text-3xl font-bold"
                    style={{
                      color: COLORS.textPrimary,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {formatCurrency(plan.price, plan.currency || 'COP')}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: COLORS.textSecondary }}
                  >
                    /mes
                  </span>
                </div>

                {plan.description && (
                  <p
                    className="text-sm mb-6"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {plan.description}
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: COLORS.success }}
                    />
                    <span style={{ color: COLORS.textSecondary }}>
                      <strong style={{ color: COLORS.textPrimary }}>
                        {getEmployeeLabel(plan.max_employees)}
                      </strong>{' '}
                      empleados
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: COLORS.success }}
                    />
                    <span style={{ color: COLORS.textSecondary }}>
                      <strong style={{ color: COLORS.textPrimary }}>
                        {getServiceLabel(plan.max_services)}
                      </strong>{' '}
                      servicios
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: COLORS.success }}
                    />
                    <span style={{ color: COLORS.textSecondary }}>
                      <strong style={{ color: COLORS.textPrimary }}>
                        {getInventoryLabel(plan.max_inventory_items)}
                      </strong>{' '}
                      productos
                    </span>
                  </li>
                  {plan.whatsapp_enabled && (
                    <li className="flex items-center gap-3 text-sm">
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: COLORS.success }}
                      />
                      <span style={{ color: COLORS.textSecondary }}>
                        <strong style={{ color: COLORS.textPrimary }}>
                          WhatsApp
                        </strong>{' '}
                        Premium
                      </span>
                    </li>
                  )}
                  <li className="flex items-center gap-3 text-sm">
                    <TrendingUp
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: COLORS.success }}
                    />
                    <span style={{ color: COLORS.textSecondary }}>
                      <strong style={{ color: COLORS.textPrimary }}>
                        Analytics
                      </strong>{' '}
                      completo
                    </span>
                  </li>
                  {plan.name !== 'Basico' && (
                    <li className="flex items-center gap-3 text-sm">
                      <Zap
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: COLORS.amber }}
                      />
                      <span style={{ color: COLORS.textSecondary }}>
                        <strong style={{ color: COLORS.textPrimary }}>
                          Soporte
                        </strong>{' '}
                        prioritario
                      </span>
                    </li>
                  )}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    backgroundColor: isCurrentPlan
                      ? `${COLORS.primary}10`
                      : COLORS.primary,
                    color: isCurrentPlan ? COLORS.primary : '#FFFFFF',
                    border: isCurrentPlan
                      ? `1px solid ${COLORS.primary}20`
                      : '1px solid transparent',
                    opacity: isCurrentPlan ? 0.8 : 1,
                  }}
                >
                  {isCurrentPlan ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Plan actual
                    </>
                  ) : (
                    <>
                      {isTrial ? 'Elegir plan' : 'Cambiar plan'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: COLORS.overlay }}
            onClick={() => setShowCancelModal(false)}
          />

          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in-95"
            style={{ backgroundColor: COLORS.surface }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{ borderColor: COLORS.border }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.error}10` }}
                  >
                    <X
                      className="w-5 h-5"
                      style={{ color: COLORS.error }}
                    />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{
                        color: COLORS.textPrimary,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      Cancelar suscripción
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X
                    className="w-5 h-5"
                    style={{ color: COLORS.textSecondary }}
                  />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p
                className="text-sm mb-6"
                style={{ color: COLORS.textSecondary }}
              >
                Perderas acceso a todas las funcionalidades premium al final del
                período de facturación actual. Tu información se mantendra
                guardada por 30 dias.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors duration-200 cursor-pointer"
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textSecondary,
                    backgroundColor: 'transparent',
                  }}
                >
                  Mantener suscripción
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  style={{
                    backgroundColor: COLORS.error,
                    color: '#FFFFFF',
                  }}
                >
                  {isCancelling && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isCancelling ? 'Cancelando...' : 'Si, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertTriangle({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

