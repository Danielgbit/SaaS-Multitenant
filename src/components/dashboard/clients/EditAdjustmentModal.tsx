'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'

interface EditAdjustmentModalProps {
  currentDescription: string
  currentReference: string | null
  onSave: (description: string, reference: string) => Promise<void>
  onClose: () => void
}

export function EditAdjustmentModal({ currentDescription, currentReference, onSave, onClose }: EditAdjustmentModalProps) {
  const COLORS = useThemeColors()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
        <h2 className="text-xl font-bold mb-4 font-heading" style={{ color: COLORS.textPrimary }}>
          Editar Ajuste
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              Descripcion *
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              placeholder="Cargo por servicio, recargo, penalidad, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              Referencia (opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              placeholder="Factura #, orden de trabajo, etc."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium transition-colors"
            style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: COLORS.warning }}
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
