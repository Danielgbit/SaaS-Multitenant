'use client'
import { useState, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

interface VoidEntryModalProps {
  entryTitle: string
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

export function VoidEntryModal({ entryTitle, onSubmit, onClose, isLoading }: VoidEntryModalProps) {
  const [reason, setReason] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    await onSubmit(reason.trim())
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Anular movimiento"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="danger" type="submit" form="void-form" disabled={isLoading || !reason.trim()} loading={isLoading}>
            Anular
          </Button>
        </>
      }>
      <form id="void-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Movimiento a anular</p>
          <p className="text-sm font-medium mt-0.5 text-[#0F172A] dark:text-[#F1F5F9]">{entryTitle}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Motivo de anulación</label>
          <textarea ref={inputRef} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Pago duplicado, error de registro..." rows={3}
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm resize-none" />
        </div>
      </form>
    </Modal>
  )
}
