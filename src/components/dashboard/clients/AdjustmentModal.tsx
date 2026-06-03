'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'

interface AdjustmentModalProps {
  onRecord: (amount: number, description: string, reference: string) => Promise<void>
  onClose: () => void
}

export function AdjustmentModal({ onRecord, onClose }: AdjustmentModalProps) {
  const COLORS = useThemeColors()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    if (!description.trim()) return
    setLoading(true)
    await onRecord(parsed, description.trim(), reference.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
        <h2 className="text-xl font-bold mb-4 font-heading" style={{ color: COLORS.textPrimary }}>
          Agregar Cargo
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              Monto
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-lg font-bold"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              placeholder="0"
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              Descripción *
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
            disabled={loading || !amount || !description.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: COLORS.warning }}
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? 'Registrando...' : 'Agregar Cargo'}
          </button>
        </div>
      </div>
    </div>
  )
}
