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
  TrendingUp
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

export function BillingClient({ plans, subscription, organizationId }: BillingClientProps) {
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
  const trialDays = subscription?.trial_ends_at ? getTrialDaysRemaining(subscription.trial_ends_at) : 0
  const currency = subscription?.planCurrency || 'COP'

  const getEmployeeLabel = (max: number) => max === -1 ? 'Ilimitados' : max.toString()
  const getServiceLabel = (max: number) => max === -1 ? 'Ilimitados' : max.toString()
  const getInventoryLabel = (max: number) => max === -1 ? 'Ilimitado' : max.toString()

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Current Plan Hero Card */}
      {subscription && (
        <div className="relative group">
          {/* Ambient glow behind card */}
          <div
            className="absolute -inset-1 rounded-3xl opacity-50 blur-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}40, ${COLORS.primary}10)`,
            }}
          />

          {/* Main Glass Card */}
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              backgroundColor: COLORS.surfaceGlass,
              backdropFilter: 'blur(24px)',
              border: `1px solid ${COLORS.borderLight}`,
              boxShadow: `0 8px 32px ${COLORS.primary}12, inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            {/* Gradient accent bar at top */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: isTrial
                  ? `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.amberLight}, ${COLORS.amber})`
                  : COLORS.primaryGradient,
              }}
            />

            {/* Decorative gradient orbs */}
            <div
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${COLORS.primary}30 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
              style={{
                background: `radial-gradient(circle, ${COLORS.amber}20 0%, transparent 70%)`,
              }}
            />

            <div className="relative p-8 md:p-10">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                  {/* Icon with glass effect */}
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: isTrial
                        ? `linear-gradient(135deg, ${COLORS.amber}20, ${COLORS.amberLight}10)`
                        : `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.primaryLight}10)`,
                      border: isTrial
                        ? `1px solid ${COLORS.amber}30`
                        : `1px solid ${COLORS.primary}20`,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl backdrop-blur-sm"
                      style={{ background: 'rgba(255,255,255,0.5)' }}
                    />
                    <div className="relative">
                      {isTrial ? (
                        <Clock className="w-8 h-8" style={{ color: COLORS.amber }} />
                      ) : (
                        <Crown className="w-8 h-8" style={{ color: COLORS.primary }} />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2
                        className="text-3xl font-bold tracking-tight"
                        style={{
                          color: COLORS.textPrimary,
                          fontFamily: "'Cormorant Garamond', serif"
                        }}
                      >
                        {subscription.planName}
                      </h2>
                      <span
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm"
                        style={{
                          background: isTrial
                            ? COLORS.warningLight
                            : COLORS.successLight,
                          color: isTrial
                            ? COLORS.warning
                            : COLORS.success,
                          border: isTrial
                            ? `1px solid ${COLORS.amber}30`
                            : `1px solid ${COLORS.success}30`,
                        }}
                      >
                        {subscription.status === 'active' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        {subscription.status === 'active' ? 'Activo'
                          : subscription.status === 'trial' ? 'Prueba gratis'
                          : subscription.status}
                      </span>
                    </div>
                    <p
                      className="text-base"
                      style={{
                        color: COLORS.textSecondary,
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                    >
                      {isTrial
                        ? <span className="font-medium" style={{ color: COLORS.amber }}>{trialDays} días restantes</span>
                        : `${formatCurrency(subscription.planPrice, currency)}/mes · Renovación mensual`}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {!isTrial && !subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: `${COLORS.error}10`,
                        color: COLORS.error,
                        border: `1px solid ${COLORS.error}20`,
                      }}
                    >
                      Cancelar plan
                    </button>
                  )}
                  {isTrial && (
                    <button
                      onClick={() => window.location.replace('/dashboard/billing?portal=true')}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md"
                      style={{
                        background: COLORS.primaryGradient,
                        color: '#FFFFFF',
                      }}
                    >
                      Configurar pago
                    </button>
                  )}
                  {!isTrial && (
                    <button
                      onClick={() => window.location.replace('/dashboard/billing?portal=true')}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: `${COLORS.primary}10`,
                        color: COLORS.primary,
                        border: `1px solid ${COLORS.primary}20`,
                      }}
                    >
                      Métodos de pago
                    </button>
                  )}
                </div>
              </div>

              {/* Trial Info Banner - Glass Effect */}
              {isTrial && (
                <div
                  className="relative p-5 rounded-2xl mb-8 overflow-hidden"
                  style={{
                    background: `${COLORS.amber}08`,
                    border: `1px solid ${COLORS.amber}20`,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                    style={{
                      background: `radial-gradient(circle, ${COLORS.amber}40 0%, transparent 70%)`,
                      transform: 'translate(30%, -30%)',
                    }}
                  />
                  <div className="relative flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${COLORS.amber}20`,
                        border: `1px solid ${COLORS.amber}30`,
                      }}
                    >
                      <Gift className="w-6 h-6" style={{ color: COLORS.amber }} />
                    </div>
                    <div>
                      <p
                        className="font-medium mb-1"
                        style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Disfruta de todas las funcionalidades
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Tu período de prueba está activo. Al finalizar, elige el plan que mejor se adapte a tu negocio.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Warning */}
              {!isTrial && subscription.cancelAtPeriodEnd && (
                <div
                  className="relative p-5 rounded-2xl mb-8 overflow-hidden"
                  style={{
                    background: `${COLORS.warning}08`,
                    border: `1px solid ${COLORS.warning}20`,
                  }}
                >
                  <div className="relative flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${COLORS.warning}20`,
                        border: `1px solid ${COLORS.warning}30`,
                      }}
                    >
                      <AlertTriangle className="w-6 h-6" style={{ color: COLORS.warning }} />
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-medium mb-2"
                        style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Tu suscripción se cancelará al final del período
                      </p>
                      <p
                        className="text-sm mb-4"
                        style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Puedes reactivarla en cualquier momento sin perder tu información.
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
                </div>
              )}

              {/* Promo Code Input - Glass Card */}
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: COLORS.surfaceGlass,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary}02 0%, transparent 50%)`,
                  }}
                />
                <div className="relative p-6">
                  <PromoCodeInput />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Elige tu plan
          </h2>
          <p
            className="text-base"
            style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Sin costos ocultos. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.planName === plan.name
            const isPopular = plan.name === 'Profesional' || plan.name === 'Premium'
            const isBasic = plan.name === 'Básico'

            return (
              <div
                key={plan.id}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Ambient glow for popular */}
                {isPopular && (
                  <div
                    className="absolute -inset-2 rounded-3xl opacity-40 blur-xl"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primary}50, ${COLORS.primary}20)`,
                    }}
                  />
                )}

                {/* Glass Card */}
                <div
                  className="relative h-full rounded-3xl overflow-hidden transition-all duration-300"
                  style={{
                    background: isPopular
                      ? COLORS.primaryGradient
                      : COLORS.surface,
                    backdropFilter: 'blur(20px)',
                    border: isPopular
                      ? `1px solid rgba(255,255,255,0.2)`
                      : `1px solid ${COLORS.border}`,
                    boxShadow: isPopular
                      ? `0 20px 60px ${COLORS.primary}35, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : `0 8px 32px ${COLORS.primary}08, inset 0 1px 0 rgba(255,255,255,0.8)`,
                  }}
                >
                  {/* Gradient overlay for popular */}
                  {isPopular && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.15) 0%, transparent 60%)',
                      }}
                    />
                  )}

                  {/* Popular Badge - Shimmer Effect */}
                  {isPopular && (
                    <div className="absolute top-5 right-5 z-10">
                      <div
                        className="relative px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: COLORS.amber,
                          boxShadow: `0 4px 16px ${COLORS.amber}40`,
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-full animate-shimmer"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                          }}
                        />
                        <span className="relative flex items-center gap-1.5 text-sm font-bold" style={{ color: '#92400E' }}>
                          <Star className="w-4 h-4 fill-amber-900" />
                          Más popular
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="relative p-8">
                    {/* Plan Header */}
                    <div className="mb-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                          style={{
                            background: isPopular
                              ? 'rgba(255,255,255,0.2)'
                              : `${COLORS.primary}10`,
                            border: isPopular
                              ? `1px solid rgba(255,255,255,0.3)`
                              : `1px solid ${COLORS.primary}10`,
                          }}
                        >
                          {isBasic ? (
                            <Shield
                              className="w-7 h-7"
                              style={{ color: isPopular ? '#FFFFFF' : COLORS.primary }}
                            />
                          ) : (
                            <Sparkles
                              className="w-7 h-7"
                              style={{ color: isPopular ? COLORS.amber : COLORS.primary }}
                            />
                          )}
                        </div>
                        <h3
                          className="text-2xl font-bold"
                          style={{
                            color: isPopular ? '#FFFFFF' : COLORS.textPrimary,
                            fontFamily: "'Cormorant Garamond', serif"
                          }}
                        >
                          {plan.name}
                        </h3>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span
                          className="text-5xl font-bold"
                          style={{
                            color: isPopular ? '#FFFFFF' : COLORS.textPrimary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          {formatCurrency(plan.price, plan.currency || 'COP')}
                        </span>
                        <span
                          className="text-base"
                          style={{
                            color: isPopular ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          /mes
                        </span>
                      </div>

                      {plan.description && (
                        <p
                          className="mt-3 text-sm"
                          style={{
                            color: isPopular ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isPopular
                              ? 'rgba(255,255,255,0.2)'
                              : COLORS.successLight,
                            border: isPopular
                              ? `1px solid rgba(255,255,255,0.2)`
                              : `1px solid ${COLORS.success}20`,
                          }}
                        >
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }}
                          />
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          <strong style={{ color: isPopular ? '#FFFFFF' : COLORS.textPrimary }}>{getEmployeeLabel(plan.max_employees)}</strong> empleados
                        </span>
                      </li>
                      <li className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isPopular
                              ? 'rgba(255,255,255,0.2)'
                              : COLORS.successLight,
                            border: isPopular
                              ? `1px solid rgba(255,255,255,0.2)`
                              : `1px solid ${COLORS.success}20`,
                          }}
                        >
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }}
                          />
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          <strong style={{ color: isPopular ? '#FFFFFF' : COLORS.textPrimary }}>{getServiceLabel(plan.max_services)}</strong> servicios
                        </span>
                      </li>
                      <li className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isPopular
                              ? 'rgba(255,255,255,0.2)'
                              : COLORS.successLight,
                            border: isPopular
                              ? `1px solid rgba(255,255,255,0.2)`
                              : `1px solid ${COLORS.success}20`,
                          }}
                        >
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }}
                          />
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          <strong style={{ color: isPopular ? '#FFFFFF' : COLORS.textPrimary }}>{getInventoryLabel(plan.max_inventory_items)}</strong> productos inventario
                        </span>
                      </li>
                      {plan.whatsapp_enabled && (
                        <li className="flex items-center gap-4">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isPopular
                                ? 'rgba(255,255,255,0.2)'
                                : COLORS.successLight,
                              border: isPopular
                                ? `1px solid rgba(255,255,255,0.2)`
                                : `1px solid ${COLORS.success}20`,
                            }}
                          >
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: isPopular ? '#FFFFFF' : COLORS.success }}
                            />
                          </div>
                          <span
                            className="text-sm"
                            style={{
                              color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary,
                              fontFamily: "'Plus Jakarta Sans', sans-serif"
                            }}
                          >
                            <strong style={{ color: isPopular ? '#FFFFFF' : COLORS.textPrimary }}>WhatsApp</strong> Premium incluido
                          </span>
                        </li>
                      )}
                      <li className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isPopular
                              ? 'rgba(255,255,255,0.2)'
                              : COLORS.successLight,
                            border: isPopular
                              ? `1px solid rgba(255,255,255,0.2)`
                              : `1px solid ${COLORS.success}20`,
                          }}
                        >
                          <TrendingUp
                            className="w-4 h-4"
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }}
                          />
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          <strong style={{ color: isPopular ? '#FFFFFF' : COLORS.textPrimary }}>Analytics</strong> completo
                        </span>
                      </li>
                      {!isBasic && (
                        <li className="flex items-center gap-4">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isPopular
                                ? `${COLORS.amber}30`
                                : COLORS.amberLight,
                              border: isPopular
                                ? `1px solid ${COLORS.amber}30`
                                : `1px solid ${COLORS.amber}20`,
                            }}
                          >
                            <Zap
                              className="w-4 h-4"
                              style={{ color: isPopular ? COLORS.amber : COLORS.amber }}
                            />
                          </div>
                          <span
                            className="text-sm"
                            style={{
                              color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary,
                              fontFamily: "'Plus Jakarta Sans', sans-serif"
                            }}
                          >
                            <strong style={{ color: isPopular ? '#FFFFFF' : COLORS.textPrimary }}>Soporte</strong> prioritario
                          </span>
                        </li>
                      )}
                    </ul>

                    {/* CTA Button - Premium Style */}
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan}
                      className="relative w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden cursor-pointer"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        background: isCurrentPlan
                          ? COLORS.surfaceSubtle
                          : isPopular
                          ? '#FFFFFF'
                          : COLORS.primary,
                        color: isCurrentPlan
                          ? COLORS.textMuted
                          : isPopular
                          ? COLORS.primary
                          : '#FFFFFF',
                      }}
                    >
                      {isCurrentPlan ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Plan actual
                        </>
                      ) : (
                        <>
                          {isTrial ? 'Elegir plan' : 'Cambiar plan'}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Hover glow effect (desktop only) */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: isPopular
                      ? `0 0 60px ${COLORS.primary}40`
                      : `0 0 40px ${COLORS.primary}15`,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancel Modal - Premium Glass */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-md"
            style={{ backgroundColor: COLORS.overlay }}
            onClick={() => setShowCancelModal(false)}
          />

          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in"
            style={{
              backgroundColor: COLORS.surface,
              backdropFilter: 'blur(24px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Gradient Header */}
            <div
              className="relative p-8"
              style={{
                background: COLORS.primaryGradient,
              }}
            >
              {/* Decorative orb */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <X className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Cancelar suscripción
                    </h2>
                    <p className="text-sm text-white/70">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-white/20"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p
                className="text-base mb-8"
                style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Perderás acceso a todas las funcionalidades premium al final del período de facturación actual.
                Tu información se mantendrá guardada por 30 días.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-4 rounded-2xl font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textSecondary,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    backgroundColor: 'transparent',
                  }}
                >
                  Mantener suscripción
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 py-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
                  style={{
                    background: isCancelling ? COLORS.textMuted : COLORS.error,
                    color: '#FFFFFF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {isCancelling && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

function AlertTriangle({ className }: { className?: string }) {
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
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}