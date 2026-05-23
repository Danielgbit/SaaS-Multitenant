'use client'

import { useState, useTransition, useCallback } from 'react'
import { X, CheckCircle2, AlertCircle, Plus, Minus } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { markCompleted } from '@/actions/confirmations/markCompleted'
import { toast } from 'sonner'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

interface MarkCompletedModalProps {
  appointmentId: string
  clientName: string
  serviceName: string
  basePrice: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function MarkCompletedModal({
  appointmentId,
  clientName,
  serviceName,
  basePrice,
  isOpen,
  onClose,
  onSuccess,
}: MarkCompletedModalProps) {
  const [isPending, startTransition] = useTransition()
  const [priceAdjustment, setPriceAdjustment] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const COLORS = useThemeColors()

  const finalPrice = basePrice + priceAdjustment

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('appointmentId', appointmentId)
    formData.set('priceAdjustment', priceAdjustment.toString())
    if (notes.trim()) {
      formData.set('notes', notes.trim())
    }

    startTransition(async () => {
      const result = await markCompleted({ success: false }, formData)
      
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Servicio completado', {
        description: 'La recepción fue notificada para confirmar el cobro',
      })
      onSuccess?.()
      onClose()
    })
  }, [appointmentId, priceAdjustment, notes, onClose, onSuccess])

  const handleClose = useCallback(() => {
    if (!isPending) {
      setPriceAdjustment(0)
      setNotes('')
      setError(null)
      onClose()
    }
  }, [isPending, onClose])

  const adjustPrice = useCallback((delta: number) => {
    setPriceAdjustment(prev => Math.max(0, prev + delta))
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-completed-title"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: COLORS.overlay }}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md border overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
        <div className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.successLight }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <h2
              id="mark-completed-title"
              className="text-xl font-bold font-heading"
              style={{ color: COLORS.textPrimary }}
            >
              Confirmar Servicio
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl transition-colors duration-200 disabled:opacity-50"
            style={{ color: COLORS.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.surfaceHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.textSecondary }}>Cliente</span>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>{clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.textSecondary }}>Servicio</span>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>{serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.textSecondary }}>Precio base</span>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                {formatCurrencyCOP(basePrice)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              Ajuste por extras (opcional)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustPrice(-10000)}
                disabled={priceAdjustment <= 0 || isPending}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textSecondary }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.border }}
                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isPending}
                className="flex-1 h-10 px-3 rounded-xl border text-center font-medium focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
                placeholder="0"
                min="0"
                step="1000"
              />
              <button
                type="button"
                onClick={() => adjustPrice(10000)}
                disabled={isPending}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textSecondary }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.border }}
                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: COLORS.textSecondary }}>
              decoration, extras, etc.
            </p>
          </div>

          <div className="p-4 rounded-xl border"
            style={{ backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' }}>
            <div className="flex justify-between items-center">
              <span className="font-medium" style={{ color: COLORS.success }}>
                Precio Total
              </span>
              <span className="text-xl font-bold" style={{ color: COLORS.success }}>
                {formatCurrencyCOP(finalPrice)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              Notas para el asistente (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none disabled:opacity-50"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
              placeholder="Decoración con gel..."
              maxLength={500}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border"
              style={{ backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.error }} />
              <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 h-11 px-4 rounded-xl border font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary, backgroundColor: COLORS.surface }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.surface }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: COLORS.primary }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {isPending ? (
                <>
                  <Spinner size="sm" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
