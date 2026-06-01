'use client'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Banknote, QrCode, ArrowRightLeft, CreditCard } from 'lucide-react'
import type { PaymentMethod } from '@/types/cash-sessions'
import { PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }

const METHODS: { key: PaymentMethod; icon: React.ReactNode; label: string }[] = [
  { key: 'cash', icon: <Banknote className="w-3.5 h-3.5" />, label: 'Efectivo' },
  { key: 'qr', icon: <QrCode className="w-3.5 h-3.5" />, label: 'QR' },
  { key: 'transfer', icon: <ArrowRightLeft className="w-3.5 h-3.5" />, label: 'Transferencia' },
  { key: 'card', icon: <CreditCard className="w-3.5 h-3.5" />, label: 'Tarjeta' },
]

interface PaymentBreakdownCardProps {
  expectedDetail: Record<PaymentMethod, number>
  realDetail: Record<PaymentMethod, number> | null
  isClosed: boolean
}

export function PaymentBreakdownCard({ expectedDetail, realDetail, isClosed }: PaymentBreakdownCardProps) {
  const COLORS = useThemeColors()

  return (
    <div
      className="p-3 sm:p-4 lg:p-5 rounded-[20px] border"
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, boxShadow: COLORS.shadow.md }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Desglose por método
      </h3>

      <div className="space-y-2.5">
        {METHODS.map(({ key, icon, label }) => {
          const expected = expectedDetail[key] ?? 0
          const diff = isClosed && realDetail ? (realDetail[key] ?? 0) - expected : null

          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: COLORS.textMuted }}>{icon}</span>
                <span className="text-xs truncate min-w-0" style={{ color: COLORS.textMuted }}>{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                  {fmt(expected)}
                </span>
                {diff !== null && diff !== 0 && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: diff > 0 ? COLORS.success : COLORS.error }}
                  >
                    {diff > 0 ? '+' : ''}{fmt(diff)}
                  </span>
                )}
                {diff === 0 && isClosed && (
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>OK</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
