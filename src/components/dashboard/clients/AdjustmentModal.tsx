'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'

interface AdjustmentModalProps {
  onRecord: (amount: number, description: string, reference: string) => Promise<void>
  onClose: () => void
}

export function AdjustmentModal({ onRecord, onClose }: AdjustmentModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0 || !description.trim()) return
    setLoading(true)
    await onRecord(parsed, description.trim(), reference.trim())
    setLoading(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Agregar Cargo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !amount || !description.trim()} loading={loading}>
            Agregar Cargo
          </Button>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">Monto</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-lg font-bold"
            placeholder="0" min="0.01" step="0.01" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">Descripción *</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827]"
            placeholder="Cargo por servicio, recargo, penalidad, etc." />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">Referencia (opcional)</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827]"
            placeholder="Factura #, orden de trabajo, etc." />
        </div>
      </div>
    </Modal>
  )
}
