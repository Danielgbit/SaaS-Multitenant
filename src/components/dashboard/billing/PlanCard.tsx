'use client'

import { CheckCircle2, Star, Shield, Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrency } from '@/lib/billing/utils'

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
}

interface PlanCardProps {
  plan: Plan
  isCurrentPlan: boolean
  isTrial: boolean
  onUpgrade: (planId: string) => void
}

const getLabel = (max: number) => max === -1 ? 'Ilimitados' : max.toString()
const getLabelInv = (max: number) => max === -1 ? 'Ilimitado' : max.toString()

export function PlanCard({ plan, isCurrentPlan, isTrial, onUpgrade }: PlanCardProps) {
  const COLORS = useThemeColors()
  const isPopular = plan.name === 'Profesional' || plan.name === 'Premium'

  return (
    <div className="rounded-2xl border p-6 md:p-8 transition-all duration-200" style={{ backgroundColor: COLORS.surface, borderColor: isCurrentPlan ? COLORS.primary : COLORS.border, boxShadow: isCurrentPlan ? `0 0 0 1px ${COLORS.primary}` : '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: isPopular ? `${COLORS.primary}10` : `${COLORS.primary}08`, border: `1px solid ${isPopular ? COLORS.primary + '15' : COLORS.border}` }}>
            {plan.name === 'Basico' ? <Shield className="w-5 h-5" style={{ color: COLORS.primary }} /> : <Sparkles className="w-5 h-5" style={{ color: COLORS.primary }} />}
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading" style={{ color: COLORS.textPrimary }}>{plan.name}</h3>
          </div>
        </div>
        {isPopular && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: COLORS.amberLight, color: COLORS.amber, border: `1px solid ${COLORS.amber}20` }}>
            <Star className="w-3 h-3 fill-amber-500" />
            Recomendado
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>{formatCurrency(plan.price, plan.currency || 'COP')}</span>
        <span className="text-sm" style={{ color: COLORS.textSecondary }}>/mes</span>
      </div>

      {plan.description && <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>{plan.description}</p>}

      <ul className="space-y-3 mb-8">
        <li className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.textPrimary }}>{getLabel(plan.max_employees)}</strong> empleados</span>
        </li>
        <li className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.textPrimary }}>{getLabel(plan.max_services)}</strong> servicios</span>
        </li>
        <li className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.textPrimary }}>{getLabelInv(plan.max_inventory_items)}</strong> productos</span>
        </li>
        {plan.whatsapp_enabled && (
          <li className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
            <span style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.textPrimary }}>WhatsApp</strong> Premium</span>
          </li>
        )}
        <li className="flex items-center gap-3 text-sm">
          <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.textPrimary }}>Analytics</strong> completo</span>
        </li>
        {plan.name !== 'Basico' && (
          <li className="flex items-center gap-3 text-sm">
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.amber }} />
            <span style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.textPrimary }}>Soporte</strong> prioritario</span>
          </li>
        )}
      </ul>

      <button onClick={() => onUpgrade(plan.id)} disabled={isCurrentPlan} className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default" style={{ backgroundColor: isCurrentPlan ? `${COLORS.primary}10` : COLORS.primary, color: isCurrentPlan ? COLORS.primary : '#FFFFFF', border: isCurrentPlan ? `1px solid ${COLORS.primary}20` : '1px solid transparent', opacity: isCurrentPlan ? 0.8 : 1 }}>
        {isCurrentPlan ? <><CheckCircle2 className="w-4 h-4" /> Plan actual</> : <>{isTrial ? 'Elegir plan' : 'Cambiar plan'} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  )
}
