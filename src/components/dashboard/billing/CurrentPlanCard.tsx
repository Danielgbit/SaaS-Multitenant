'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Crown, Gift, AlertTriangle, X } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrency, getTrialDaysRemaining } from '@/lib/billing/utils'
import { cancelSubscription } from '@/actions/billing/cancelSubscription'
import { reactivateSubscription } from '@/actions/billing/reactivateSubscription'

interface CurrentPlanCardProps {
  subscription: {
    id: string
    status: string
    trial_ends_at: string | null
    planName: string
    planPrice: number
    planCurrency?: string
    isActive: boolean
    cancelAtPeriodEnd: boolean
  }
  organizationId: string
}

export function CurrentPlanCard({ subscription, organizationId }: CurrentPlanCardProps) {
  const COLORS = useThemeColors()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const isTrial = subscription?.status === 'trial'
  const trialDays = subscription?.trial_ends_at ? getTrialDaysRemaining(subscription.trial_ends_at) : 0
  const currency = subscription?.planCurrency || 'COP'

  const handleCancel = async () => {
    setIsCancelling(true)
    await cancelSubscription({ organizationId })
    setShowCancelModal(false)
    setIsCancelling(false)
    window.location.reload()
  }

  return (
    <>
      <div className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: isTrial ? `${COLORS.amber}15` : `${COLORS.primary}10`, border: `1px solid ${isTrial ? COLORS.amber + '20' : COLORS.primary + '15'}` }}>
              {isTrial ? <Clock className="w-6 h-6" style={{ color: COLORS.amber }} /> : <Crown className="w-6 h-6" style={{ color: COLORS.primary }} />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.textPrimary }}>{subscription.planName}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: isTrial ? COLORS.warningLight : COLORS.successLight, color: isTrial ? COLORS.warning : COLORS.success, border: `1px solid ${isTrial ? COLORS.warning + '20' : COLORS.success + '20'}` }}>
                  {subscription.status === 'active' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Activo</> : subscription.status === 'trial' ? <><Clock className="w-3.5 h-3.5" /> Prueba gratis</> : subscription.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {isTrial ? `${trialDays} días restantes en tu período de prueba` : `${formatCurrency(subscription.planPrice, currency)}/mes · Renovación mensual`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {!isTrial && !subscription.cancelAtPeriodEnd && (
              <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer" style={{ color: COLORS.error, border: `1px solid ${COLORS.error}20`, backgroundColor: 'transparent' }}>
                Cancelar plan
              </button>
            )}
            {!isTrial && (
              <button onClick={() => window.location.replace('/dashboard/facturacion?portal=true')} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer" style={{ color: COLORS.primary, border: `1px solid ${COLORS.primary}20`, backgroundColor: 'transparent' }}>
                Métodos de pago
              </button>
            )}
            {isTrial && (
              <button onClick={() => window.location.replace('/dashboard/facturacion?portal=true')} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer" style={{ background: COLORS.primaryGradient, color: COLORS.textOnPrimary }}>
                Configurar pago
              </button>
            )}
          </div>
        </div>

        {isTrial && (
          <div className="mt-6 p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: COLORS.warningLight, border: `1px solid ${COLORS.warning}20` }}>
            <Gift className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} />
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>Disfruta de todas las funcionalidades</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>Tu período de prueba esta activo. Al finalizar, elige el plan que mejor se adapte a tu negocio.</p>
            </div>
          </div>
        )}

        {!isTrial && subscription.cancelAtPeriodEnd && (
          <div className="mt-6 p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: COLORS.errorLight, border: `1px solid ${COLORS.error}20` }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.error }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>Tu suscripción se cancelara al final del período</p>
              <p className="text-xs mt-0.5 mb-3" style={{ color: COLORS.textSecondary }}>Puedes reactivarla en cualquier momento sin perder tu información.</p>
              <button onClick={async () => { await reactivateSubscription({ organizationId }); window.location.reload() }} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer" style={{ background: COLORS.primaryGradient, color: COLORS.textOnPrimary }}>
                Reactivar suscripción
              </button>
            </div>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: COLORS.overlay }} onClick={() => setShowCancelModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in-95" style={{ backgroundColor: COLORS.surface }}>
            <div className="p-6 border-b" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.error}10` }}>
                    <X className="w-5 h-5" style={{ color: COLORS.error }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.textPrimary }}>Cancelar suscripción</h2>
                  </div>
                </div>
                <button onClick={() => setShowCancelModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" aria-label="Cerrar">
                  <X className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
                Perderas acceso a todas las funcionalidades premium al final del período de facturación actual. Tu información se mantendra guardada por 30 dias.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors duration-200 cursor-pointer" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, backgroundColor: 'transparent' }}>
                  Mantener suscripción
                </button>
                <button onClick={handleCancel} disabled={isCancelling} className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70" style={{ backgroundColor: COLORS.error, color: COLORS.textOnError }}>
                  {isCancelling && <Spinner size="sm" />}
                  {isCancelling ? 'Cancelando...' : 'Si, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
