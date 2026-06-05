'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [paymentReference, setPaymentReference] = useState('')

  return (
    <Modal isOpen={true} onClose={onClose} title="Registrar Pago"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onConfirm(paymentMethod, paymentReference || undefined)} disabled={loading} loading={loading}>
            <CheckCircle className="w-4 h-4" />
            Confirmar Pago
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
          <span className="text-sm font-medium text-[#475569] dark:text-[#94A3B8]">Total a pagar</span>
          <span className="text-lg font-bold text-[#16A34A]">{totalNetPay}</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#475569] dark:text-[#94A3B8]">Método de pago</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-[#0F172A] dark:text-[#F1F5F9]">
            {Object.entries(PAYMENT_METHODS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#475569] dark:text-[#94A3B8]">Referencia (opcional)</label>
          <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Número de transacción, referencia..."
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-[#0F172A] dark:text-[#F1F5F9]" />
        </div>
      </div>
    </Modal>
  )
}
