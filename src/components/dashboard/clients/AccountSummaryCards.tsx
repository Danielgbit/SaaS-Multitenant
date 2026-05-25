'use client'

import { DollarSign, TrendingUp, CheckCircle2, CreditCard, AlertTriangle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface AccountSummaryCardsProps {
  balance: number
  totalPurchased: number
  totalPaid: number
  creditLimit: number
  isOverLimit: boolean
  isAtWarningThreshold: boolean
}

export function AccountSummaryCards({ balance, totalPurchased, totalPaid, creditLimit, isOverLimit, isAtWarningThreshold }: AccountSummaryCardsProps) {
  const COLORS = useThemeColors()

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: isOverLimit ? COLORS.error : COLORS.border }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '15' }}><DollarSign className="w-4 h-4" style={{ color: COLORS.error }} /></div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Saldo Pendiente</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.error }}>{formatCurrencyCOP(balance)}</p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}><TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} /></div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Total Comprado</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{formatCurrencyCOP(totalPurchased)}</p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}><CheckCircle2 className="w-4 h-4" style={{ color: COLORS.primary }} /></div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Total Pagado</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{formatCurrencyCOP(totalPaid)}</p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}><CreditCard className="w-4 h-4" style={{ color: COLORS.warning }} /></div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Límite Crédito</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{creditLimit > 0 ? formatCurrencyCOP(creditLimit) : 'Sin límite'}</p>
        </div>
      </div>

      {creditLimit > 0 && (
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: COLORS.textSecondary }}>Crédito usado</span>
            <span style={{ color: COLORS.textPrimary }}>{formatCurrencyCOP(balance)} / {formatCurrencyCOP(creditLimit)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((balance / creditLimit) * 100, 100)}%`, backgroundColor: isOverLimit ? COLORS.error : isAtWarningThreshold ? COLORS.warning : COLORS.success }} />
          </div>
          {isOverLimit && (
            <p className="text-sm mt-2" style={{ color: COLORS.error }}><AlertTriangle className="w-4 h-4 inline mr-1" />Cliente ha excedido el límite de crédito</p>
          )}
        </div>
      )}
    </>
  )
}
