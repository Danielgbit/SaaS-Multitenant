'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { PaymentMethod } from '@/types/cash-sessions'
import { PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'

interface PaymentModalProps {
  balance: number
  onRecord: (amount: number, method: PaymentMethod, reference: string) => Promise<void>
  onClose: () => void
}

export function PaymentModal({ balance, onRecord, onClose }: PaymentModalProps) {
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
    <Modal isOpen={true} onClose={onClose} title="Registrar Pago"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !amount} loading={loading}>
            Registrar Pago
          </Button>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
            Monto (máximo: {formatCurrencyCOP(balance)})
          </label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-lg font-bold"
            placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">Método de pago</label>
          <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827]">
            <option value="cash">{PAYMENT_METHOD_LABELS.cash}</option>
            <option value="transfer">{PAYMENT_METHOD_LABELS.transfer}</option>
            <option value="qr">{PAYMENT_METHOD_LABELS.qr}</option>
            <option value="card">{PAYMENT_METHOD_LABELS.card}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">Referencia (opcional)</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827]"
            placeholder="Últimos 4 dígitos, ID transacción, etc." />
        </div>
      </div>
    </Modal>
  )
}
