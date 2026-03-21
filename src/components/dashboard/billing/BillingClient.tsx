'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  CheckCircle2, 
  CreditCard, 
  Calendar,
  Loader2,
  Zap,
  X,
  Star,
  Shield,
  Sparkles,
  ArrowRight,
  Crown
} from 'lucide-react'
import { createCheckoutSession } from '@/actions/billing/createCheckoutSession'
import { cancelSubscription } from '@/actions/billing/cancelSubscription'
import { reactivateSubscription } from '@/actions/billing/reactivateSubscription'
import { formatCurrency, getTrialDaysRemaining } from '@/lib/billing/utils'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    surfaceGlassStrong: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? '#334155' : '#E2E8F0',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#D97706',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    amber: '#F59E0B',
    amberLight: isDark ? '#78350F' : '#FEF3C7',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}

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
  const COLORS = useColors()
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
      window.location.href = result.url
    }
  }

  const currentPlan = plans.find(p => p.name === subscription?.planName)
  const isTrial = subscription?.status === 'trial'
  const trialDays = subscription?.trial_ends_at ? getTrialDaysRemaining(subscription.trial_ends_at) : 0
  const currency = subscription?.planCurrency || 'COP'

  const getEmployeeLabel = (max: number) => max === -1 ? 'Ilimitados' : max.toString()
  const getServiceLabel = (max: number) => max === -1 ? 'Ilimitados' : max.toString()
  const getInventoryLabel = (max: number) => max === -1 ? 'Ilimitado' : max.toString()

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0F4C5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Hero Card - Page Header Pattern */}
      {subscription && (
        <div 
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{ 
            background: COLORS.primaryGradient,
          }}
        >
          {/* Decorations */}
          <div 
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{ 
              backgroundColor: '#FFFFFF',
              transform: 'translate(30%, -30%)' 
            }} 
          />
          <div 
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{ 
              backgroundColor: '#FFFFFF',
              transform: 'translate(-30%, 30%)' 
            }} 
          />
          <div 
            className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full opacity-5"
            style={{ 
              backgroundColor: '#FFFFFF',
              transform: 'translate(50%, -50%)' 
            }} 
          />
          
          {/* Content */}
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm"
                style={{ 
                  backgroundColor: isTrial ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.2)' 
                }}
              >
                {isTrial ? (
                  <Calendar className="w-7 h-7 text-amber-300" />
                ) : (
                  <Crown className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 
                    className="text-2xl font-bold tracking-tight text-white"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {subscription.planName}
                  </h3>
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ 
                      backgroundColor: isTrial ? COLORS.amberLight : 'rgba(255,255,255,0.2)',
                      color: isTrial ? '#92400E' : 'rgba(255,255,255,0.9)'
                    }}
                  >
                    {subscription.status === 'active' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Calendar className="w-3 h-3" />
                    )}
                    {subscription.status === 'active' ? 'Activo' : 
                     subscription.status === 'trial' ? 'Prueba gratis' : subscription.status}
                  </span>
                </div>
                <p className="text-sm text-white/80">
                  {isTrial 
                    ? `${trialDays} días restantes` 
                    : `${formatCurrency(subscription.planPrice, currency)}/mes · Renovación mensual`}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {!isTrial && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  Cancelar plan
                </button>
              )}
              {isTrial && (
                <button
                  onClick={() => window.location.href = '/dashboard/billing?portal=true'}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                  style={{ color: '#0F4C5C', backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  Configurar pago
                </button>
              )}
              {!isTrial && (
                <button
                  onClick={() => window.location.href = '/dashboard/billing?portal=true'}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                  style={{ color: '#0F4C5C', backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  Métodos de pago
                </button>
              )}
            </div>
          </div>

          {/* Trial Info Banner */}
          {isTrial && (
            <div 
              className="relative mt-6 p-4 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              <p className="text-sm text-amber-100">
                Disfruta de todas las funcionalidades durante tu período de prueba. 
                Al finalizar, elige el plan que mejor se adapte a tu negocio.
              </p>
            </div>
          )}

          {/* Cancellation Warning */}
          {!isTrial && subscription.cancelAtPeriodEnd && (
            <div 
              className="relative mt-6 p-4 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              <p className="text-sm text-amber-100 mb-3">
                Tu suscripción se cancelará al final del período de facturación. 
                Puedes reactivarla en cualquier momento.
              </p>
              <button
                onClick={async () => {
                  await reactivateSubscription({ organizationId })
                  window.location.reload()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: '#92400E', backgroundColor: 'rgba(255,255,255,0.9)' }}
              >
                Reactivar suscripción
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plans Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 
            className="text-3xl font-semibold mb-2"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Elige tu plan
          </h2>
          <p style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Sin costos ocultos. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.planName === plan.name
            const isPopular = plan.name === 'Profesional' || plan.name === 'Premium'
            const isBasic = plan.name === 'Básico'
            
            return (
              <div 
                key={plan.id}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Glassmorphism Card */}
                <div 
                  className="group relative h-full rounded-2xl overflow-hidden transition-all duration-300 cursor-default"
                  style={{ 
                    background: isPopular 
                      ? COLORS.primaryGradient
                      : COLORS.surfaceGlass,
                    border: `1px solid ${isPopular ? 'transparent' : COLORS.border}`,
                    boxShadow: isPopular 
                      ? '0 25px 50px -12px rgba(15, 76, 92, 0.25)' 
                      : '0 4px 24px rgba(15, 76, 92, 0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPopular) {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(15, 76, 92, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPopular) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(15, 76, 92, 0.08)'
                    }
                  }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-4 right-4 z-10">
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span className="text-xs font-semibold text-white">Más popular</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 md:p-8">
                    {/* Plan Header */}
                    <div className="mb-6">
                      <div className={`flex items-center gap-3 mb-4 ${isPopular ? 'text-white' : ''}`}>
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ 
                            backgroundColor: isPopular 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : `${COLORS.primary}15` 
                          }}
                        >
                          {isBasic ? (
                            <Shield 
                              className="w-6 h-6" 
                              style={{ color: isPopular ? '#FFFFFF' : COLORS.primary }} 
                            />
                          ) : (
                            <Sparkles 
                              className="w-6 h-6" 
                              style={{ color: isPopular ? '#FCD34D' : COLORS.primary }} 
                            />
                          )}
                        </div>
                        <h3 
                          className="text-xl font-semibold"
                          style={{ 
                            color: isPopular ? '#FFFFFF' : COLORS.textPrimary,
                            fontFamily: "'Cormorant Garamond', serif"
                          }}
                        >
                          {plan.name}
                        </h3>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span 
                          className="text-4xl font-bold"
                          style={{ 
                            color: isPopular ? '#FFFFFF' : COLORS.textPrimary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          {formatCurrency(plan.price, plan.currency || 'COP')}
                        </span>
                        <span 
                          className="text-sm"
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
                          className="mt-2 text-sm"
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
                    <ul className="space-y-3 mb-8">
                      <li 
                        className="flex items-center gap-3 text-sm"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                      >
                        <div 
                          className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: isPopular 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : COLORS.successLight 
                          }}
                        >
                          <CheckCircle2 
                            className="w-3.5 h-3.5" 
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }} 
                          />
                        </div>
                        <span 
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <strong>{getEmployeeLabel(plan.max_employees)}</strong> empleados
                        </span>
                      </li>
                      <li 
                        className="flex items-center gap-3 text-sm"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                      >
                        <div 
                          className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: isPopular 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : COLORS.successLight 
                          }}
                        >
                          <CheckCircle2 
                            className="w-3.5 h-3.5" 
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }} 
                          />
                        </div>
                        <span 
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <strong>{getServiceLabel(plan.max_services)}</strong> servicios
                        </span>
                      </li>
                      <li 
                        className="flex items-center gap-3 text-sm"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                      >
                        <div 
                          className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: isPopular 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : COLORS.successLight 
                          }}
                        >
                          <CheckCircle2 
                            className="w-3.5 h-3.5" 
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }} 
                          />
                        </div>
                        <span 
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <strong>{getInventoryLabel(plan.max_inventory_items)}</strong> productos inventario
                        </span>
                      </li>
                      {plan.whatsapp_enabled && (
                        <li 
                          className="flex items-center gap-3 text-sm"
                          style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                        >
                          <div 
                            className="w-5 h-5 rounded-lg flex items-center justify-center"
                            style={{ 
                              backgroundColor: isPopular 
                                ? 'rgba(255, 255, 255, 0.2)' 
                                : COLORS.successLight 
                            }}
                          >
                            <CheckCircle2 
                              className="w-3.5 h-3.5" 
                              style={{ color: isPopular ? '#FFFFFF' : COLORS.success }} 
                            />
                          </div>
                          <span 
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            <strong>WhatsApp</strong> Premium incluido
                          </span>
                        </li>
                      )}
                      <li 
                        className="flex items-center gap-3 text-sm"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                      >
                        <div 
                          className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: isPopular 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : COLORS.successLight 
                          }}
                        >
                          <CheckCircle2 
                            className="w-3.5 h-3.5" 
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }} 
                          />
                        </div>
                        <span 
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <strong>Analytics</strong> completo
                        </span>
                      </li>
                      <li 
                        className="flex items-center gap-3 text-sm"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                      >
                        <div 
                          className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: isPopular 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : COLORS.successLight 
                          }}
                        >
                          <CheckCircle2 
                            className="w-3.5 h-3.5" 
                            style={{ color: isPopular ? '#FFFFFF' : COLORS.success }} 
                          />
                        </div>
                        <span 
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <strong>Email</strong> confirmaciones
                        </span>
                      </li>
                      {!isBasic && (
                        <li 
                          className="flex items-center gap-3 text-sm"
                          style={{ color: isPopular ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}
                        >
                          <div 
                            className="w-5 h-5 rounded-lg flex items-center justify-center"
                            style={{ 
                              backgroundColor: isPopular 
                                ? 'rgba(245, 158, 11, 0.4)' 
                                : COLORS.amberLight 
                            }}
                          >
                            <Zap 
                              className="w-3.5 h-3.5" 
                              style={{ color: isPopular ? '#FCD34D' : COLORS.amber }} 
                            />
                          </div>
                          <span 
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            <strong>Soporte</strong> prioritario
                          </span>
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan}
                      className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        ...(isCurrentPlan 
                          ? isPopular
                            ? { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }
                            : { backgroundColor: COLORS.surfaceSubtle, color: COLORS.textMuted, cursor: 'not-allowed' }
                          : isPopular
                          ? { backgroundColor: '#FFFFFF', color: COLORS.primary }
                          : { backgroundColor: COLORS.primary, color: '#FFFFFF' }
                        ),
                        ...(!isCurrentPlan && !isPopular && {
                          '--hover-bg': COLORS.primaryLight,
                        }),
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentPlan && !isPopular) {
                          e.currentTarget.style.backgroundColor = COLORS.primaryLight
                        } else if (!isCurrentPlan && isPopular) {
                          e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentPlan && !isPopular) {
                          e.currentTarget.style.backgroundColor = COLORS.primary
                        } else if (!isCurrentPlan && isPopular) {
                          e.currentTarget.style.backgroundColor = '#FFFFFF'
                        }
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
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancel Modal - Gradient Header Pattern */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: COLORS.overlay }}
            onClick={() => setShowCancelModal(false)}
          />
          <div 
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
            style={{ 
              backgroundColor: COLORS.surface,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Header with gradient */}
            <div 
              className="relative p-6 overflow-hidden"
              style={{ 
                background: COLORS.primaryGradient,
              }}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  transform: 'translate(30%, -30%)' 
                }} 
              />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 
                      className="text-xl font-semibold text-white"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Cancelar suscripción
                    </h2>
                    <p className="text-xs text-white/80">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/20"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p 
                className="text-sm mb-6"
                style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Perderás acceso a todas las funcionalidades premium al final del período de facturación actual. 
                Tu información se mantendrá guardada por 30 días.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors duration-200"
                  style={{ 
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textSecondary,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  Mantener suscripción
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: COLORS.error,
                    color: '#FFFFFF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#B91C1C'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.error
                  }}
                >
                  {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
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
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
          opacity: 0;
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
