'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { PaymentMethod } from '@/types/cash-sessions'
import { PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'

interface PaymentModalProps {
  balance: number
  onRecord: (amount: number, method: PaymentMethod, reference: string) => Promise<void>
  onClose: () => void
}

export function PaymentModal({ balance, onRecord, onClose }: PaymentModalProps) {
  const COLORS = useThemeColors()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    setLoading(true)
    await onRecord(parsed, method, reference)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
        <h2 className="text-xl font-bold mb-4 font-heading" style={{ color: COLORS.textPrimary }}>
          Registrar Pago
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              Monto (máximo: {formatCurrencyCOP(balance)})
            </label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-lg font-bold" style={{ borderColor: COLORS.border, color: COLORS.textPrimary }} placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>Método de pago</label>
            <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full px-4 py-3 rounded-xl border" style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}>
              <option value="cash">{PAYMENT_METHOD_LABELS.cash}</option>
              <option value="transfer">{PAYMENT_METHOD_LABELS.transfer}</option>
              <option value="qr">{PAYMENT_METHOD_LABELS.qr}</option>
              <option value="card">{PAYMENT_METHOD_LABELS.card}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>Referencia (opcional)</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full px-4 py-3 rounded-xl border" style={{ borderColor: COLORS.border, color: COLORS.textPrimary }} placeholder="Últimos 4 dígitos, ID transacción, etc." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium transition-colors" style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !amount} className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: COLORS.success }}>
            {loading ? <Spinner size="sm" /> : null}
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
