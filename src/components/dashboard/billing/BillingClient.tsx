'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  Crown,
  Loader2,
  Zap,
  X
} from 'lucide-react'
import { createCheckoutSession } from '@/actions/billing/createCheckoutSession'
import { cancelSubscription } from '@/actions/billing/cancelSubscription'
import { reactivateSubscription } from '@/actions/billing/reactivateSubscription'
import { requestWhatsAppActivation } from '@/actions/billing/requestWhatsAppActivation'
import { formatCurrency, formatDate, getTrialDaysRemaining } from '@/lib/billing/utils'

const COLORS = {
  primary: '#0F4C5C',
  primaryLight: '#1A6B7C',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFB',
  border: '#E8ECEE',
  textPrimary: '#1A2B32',
  textSecondary: '#5A6B70',
  textMuted: '#8A9A9E',
}

interface Plan {
  id: string
  name: string
  price: number
  max_employees: number
  max_services: number
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
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppForm, setWhatsAppForm] = useState({ contactName: '', businessPhone: '' })
  
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRequestingWhatsApp, setIsRequestingWhatsApp] = useState(false)

  const handleCancel = async () => {
    setIsCancelling(true)
    await cancelSubscription({ organizationId })
    setShowCancelModal(false)
    setIsCancelling(false)
    window.location.reload()
  }

  const handleWhatsAppSubmit = async (formData: FormData) => {
    setIsRequestingWhatsApp(true)
    await requestWhatsAppActivation({
      organizationId,
      contactName: formData.get('contactName') as string,
      businessPhone: formData.get('businessPhone') as string,
    })
    setShowWhatsAppModal(false)
    setIsRequestingWhatsApp(false)
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

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      {subscription && (
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                style={{ backgroundColor: isTrial ? COLORS.warningLight : COLORS.successLight }}>
                {isTrial ? <Calendar className="w-6 h-6" style={{ color: COLORS.warning }} /> : 
                  <CheckCircle2 className="w-6 h-6" style={{ color: COLORS.success }} />}
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                  {subscription.planName}
                </h3>
                <p style={{ color: COLORS.textSecondary }}>
                  {isTrial 
                    ? `${trialDays} días restantes de prueba` 
                    : ` ${formatCurrency(subscription.planPrice)}/mes`}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              subscription.status === 'active' ? 'bg-green-100 text-green-700' :
              subscription.status === 'trial' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {subscription.status === 'active' ? 'Activo' : 
               subscription.status === 'trial' ? 'Prueba' : subscription.status}
            </span>
          </div>

          {!isTrial && subscription.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: COLORS.warningLight }}>
              <p className="text-sm" style={{ color: COLORS.warning }}>
                Tu suscripción se cancelará al final del período de facturación.
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {!isTrial && subscription.cancelAtPeriodEnd ? (
              <button
                onClick={async () => {
                  await reactivateSubscription({ organizationId })
                  window.location.reload()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: COLORS.primary, color: '#FFF' }}
              >
                Reactivar suscripción
              </button>
            ) : !isTrial && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: COLORS.error, backgroundColor: COLORS.errorLight }}
              >
                Cancelar suscripción
              </button>
            )}
            <button
              onClick={() => window.location.href = '/dashboard/billing?portal=true'}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}
            >
              Gestionar métodos de pago
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.textPrimary }}>
          Planes disponibles
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.planName === plan.name
            const isPopular = plan.name === 'Profesional'
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 ${isPopular ? 'ring-2' : ''}`}
                style={{ 
                  border: `1px solid ${isPopular ? COLORS.primary : COLORS.border}`,
                  boxShadow: isPopular ? '0 8px 30px rgba(15,76,92,0.15)' : 'none'
                }}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: COLORS.primary, color: '#FFF' }}>
                    Más popular
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                    {plan.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
                      {formatCurrency(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span style={{ color: COLORS.textSecondary }}>/mes</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
                      <span style={{ color: COLORS.textSecondary }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                  className="w-full py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: isCurrentPlan ? COLORS.border : COLORS.primary,
                    color: isCurrentPlan ? COLORS.textMuted : '#FFF',
                    opacity: isCurrentPlan ? 0.5 : 1,
                  }}
                >
                  {isCurrentPlan ? 'Plan actual' : plan.price === 0 ? 'Plan gratuito' : 'Cambiar plan'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* WhatsApp Section */}
      {currentPlan?.whatsapp_enabled && (
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.successLight }}>
              <Zap className="w-6 h-6" style={{ color: COLORS.success }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                WhatsApp Premium
              </h3>
              <p style={{ color: COLORS.textSecondary }}>
                Activa los recordatorios automáticos por WhatsApp para tu negocio
              </p>
            </div>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.primary, color: '#FFF' }}
            >
              Solicitar activación
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textPrimary }}>
              Cancelar suscripción
            </h3>
            <p style={{ color: COLORS.textSecondary }} className="mb-6">
              ¿Estás seguro de que quieres cancelar tu suscripción? 
              Mantendrás el acceso hasta el final del período de facturación actual.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}
              >
                Mantener suscripción
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-6 py-3 rounded-xl font-medium"
                style={{ backgroundColor: COLORS.error, color: '#FFF' }}
              >
                {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                Solicitar WhatsApp
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)}>
                <X className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              </button>
            </div>
            <p style={{ color: COLORS.textSecondary }} className="mb-6">
              Completa tus datos de contacto y nuestro equipo te contactará para activar WhatsApp en tu plan.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleWhatsAppSubmit(new FormData(e.currentTarget)) }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                  Nombre de contacto
                </label>
                <input
                  name="contactName"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                  Teléfono de negocio
                </label>
                <input
                  name="businessPhone"
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-medium"
                style={{ backgroundColor: COLORS.primary, color: '#FFF' }}
              >
                Enviar solicitud
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
