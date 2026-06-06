'use client'

import { useState, useTransition, useCallback } from 'react'
import { AlertCircle, DollarSign } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { adjustPrice } from '@/actions/confirmations/adjustPrice'
import { toast } from 'sonner'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface AdjustPriceModalProps {
  appointmentId: string
  currentPrice: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdjustPriceModal({ appointmentId, currentPrice, isOpen, onClose, onSuccess }: AdjustPriceModalProps) {
  const [isPending, startTransition] = useTransition()
  const [newPrice, setNewPrice] = useState(currentPrice)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) { setError('Ingresa el motivo del ajuste'); return }
    if (newPrice < 0) { setError('El precio no puede ser negativo'); return }
    setError(null)
    const formData = new FormData()
    formData.set('appointmentId', appointmentId)
    formData.set('newPrice', newPrice.toString())
    formData.set('reason', reason.trim())
    startTransition(async () => {
      const result = await adjustPrice({ success: false, error: undefined }, formData)
      if (result.error) { setError(result.error); toast.error(result.error); return }
      toast.success('Precio ajustado correctamente')
      onSuccess?.(); onClose()
    })
  }, [appointmentId, newPrice, reason, onClose, onSuccess])

  const handleClose = useCallback(() => {
    if (!isPending) { setNewPrice(currentPrice); setReason(''); setError(null); onClose() }
  }, [isPending, currentPrice, onClose])

  if (!isOpen) return null

  const priceDiff = newPrice - currentPrice

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajustar Precio"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending || !reason.trim()} loading={isPending}>
            Ajustar Precio
          </Button>
        </>
      }>
      <div className="space-y-4">
        <div className="flex justify-between text-xs">
          <span className="text-[#475569] dark:text-[#94A3B8]">Precio actual</span>
          <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{formatCurrencyCOP(currentPrice)}</span>
        </div>

        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Nuevo precio</label>
          <input type="number" value={newPrice} onChange={(e) => setNewPrice(Math.max(0, parseInt(e.target.value) || 0))} disabled={isPending}
            className="w-full mt-1 h-11 px-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] font-medium"
            min="0" step="1000" />
        </div>

        {priceDiff !== 0 && (
          <div className={`p-3 rounded-xl text-xs font-medium ${priceDiff > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
            {priceDiff > 0 ? 'Aumento' : 'Reducción'}: {priceDiff > 0 ? '+' : ''}{formatCurrencyCOP(priceDiff)}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Motivo del ajuste</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} disabled={isPending} rows={2}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm resize-none"
            placeholder="Ej: Cliente pidió decoración especial" maxLength={200} />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
