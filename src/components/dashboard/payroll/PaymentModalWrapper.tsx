'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'

type PaymentMethod = keyof typeof PAYMENT_METHODS
const PAYMENT_METHODS = {
  efectivo: { label: 'Efectivo' },
  nequi: { label: 'Nequi' },
  daviplata: { label: 'DaviPlata' },
  pse: { label: 'PSE' },
  qr_nequi: { label: 'QR Nequi' },
  qr_bancolombia: { label: 'QR Bancolombia' },
  tarjeta_debito: { label: 'Tarjeta Débito' },
  tarjeta_credito: { label: 'Tarjeta Crédito' },
} as const

export function PaymentModalWrapper({
  onClose, onConfirm, loading, totalNetPay,
}: {
  onClose: () => void
  onConfirm: (method: PaymentMethod, reference?: string) => void
  loading: boolean
  totalNetPay: string
}) {
  const COLORS = useThemeColors()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [paymentReference, setPaymentReference] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
        <h3 className="text-xl font-bold mb-4 font-heading" style={{ color: COLORS.textPrimary }}>
          Registrar Pago
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Total a pagar</span>
            <span className="text-lg font-bold" style={{ color: COLORS.success }}>{totalNetPay}</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Método de pago</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}>
              {Object.entries(PAYMENT_METHODS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Referencia (opcional)</label>
            <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Número de transacción, referencia..."
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}>
            Cancelar
          </button>
          <button onClick={() => onConfirm(paymentMethod, paymentReference || undefined)} disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.success }}>
            {loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}
