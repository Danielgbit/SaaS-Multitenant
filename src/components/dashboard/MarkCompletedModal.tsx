'use client'

import { useState, useTransition, useCallback } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { markCompleted } from '@/actions/confirmations/markCompleted'
import { toast } from 'sonner'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface MarkCompletedModalProps {
  appointmentId: string
  clientName: string
  serviceName: string
  basePrice: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function MarkCompletedModal({ appointmentId, clientName, serviceName, basePrice, isOpen, onClose, onSuccess }: MarkCompletedModalProps) {
  const [isPending, startTransition] = useTransition()
  const [priceAdjustment, setPriceAdjustment] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const finalPrice = basePrice + priceAdjustment

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    const formData = new FormData()
    formData.set('appointmentId', appointmentId)
    formData.set('priceAdjustment', priceAdjustment.toString())
    if (notes.trim()) formData.set('notes', notes.trim())
    startTransition(async () => {
      const result = await markCompleted({ success: false }, formData)
      if (result.error) { setError(result.error); toast.error(result.error); return }
      toast.success('Servicio completado', { description: 'La recepción fue notificada para confirmar el cobro' })
      onClose()
      if (onSuccess) onSuccess()
    })
  }, [appointmentId, priceAdjustment, notes, onClose, onSuccess])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Completar Servicio"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={isPending}>Completar Servicio</Button>
        </>
      }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] space-y-1">
          <p className="font-medium text-sm">{clientName}</p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{serviceName}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Ajuste de precio</label>
          <div className="flex items-center gap-2 mt-1">
            <button type="button" onClick={() => setPriceAdjustment(Math.max(-basePrice, priceAdjustment - 1000))}
              className="w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-[#334155] flex items-center justify-center"><Minus className="w-4 h-4" /></button>
            <span className="flex-1 text-center font-bold text-lg">{formatCurrencyCOP(finalPrice)}</span>
            <button type="button" onClick={() => setPriceAdjustment(priceAdjustment + 1000)}
              className="w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-[#334155] flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
          {priceAdjustment !== 0 && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Ajuste: {formatCurrencyCOP(priceAdjustment)}</p>}
        </div>

        <div>
          <label htmlFor="mc-notes" className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Notas (opcional)</label>
          <textarea id="mc-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm resize-none" />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  )
}
