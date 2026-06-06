'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'

interface EditAdjustmentModalProps {
  currentDescription: string
  currentReference: string | null
  onSave: (description: string, reference: string) => Promise<void>
  onClose: () => void
}

export function EditAdjustmentModal({ currentDescription, currentReference, onSave, onClose }: EditAdjustmentModalProps) {
  const [description, setDescription] = useState(currentDescription)
  const [reference, setReference] = useState(currentReference || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) return
    setLoading(true)
    await onSave(description.trim(), reference.trim())
    setLoading(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Ajuste"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !description.trim()} loading={loading}>
            Guardar Cambios
          </Button>
        </>
      }>
      <div className="space-y-4">
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
