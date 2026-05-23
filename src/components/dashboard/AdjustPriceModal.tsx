'use client'

import { useState, useTransition, useCallback } from 'react'
import { X, AlertCircle, DollarSign } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { adjustPrice } from '@/actions/confirmations/adjustPrice'
import { toast } from 'sonner'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

interface AdjustPriceModalProps {
  appointmentId: string
  currentPrice: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdjustPriceModal({
  appointmentId,
  currentPrice,
  isOpen,
  onClose,
  onSuccess,
}: AdjustPriceModalProps) {
  const [isPending, startTransition] = useTransition()
  const [newPrice, setNewPrice] = useState(currentPrice)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const COLORS = useThemeColors()

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError('Ingresa el motivo del ajuste')
      return
    }

    if (newPrice < 0) {
      setError('El precio no puede ser negativo')
      return
    }

    setError(null)

    const formData = new FormData()
    formData.set('appointmentId', appointmentId)
    formData.set('newPrice', newPrice.toString())
    formData.set('reason', reason.trim())

    startTransition(async () => {
      const result = await adjustPrice({ success: false, error: undefined }, formData)
      
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Precio ajustado correctamente')
      onSuccess?.()
      onClose()
    })
  }, [appointmentId, newPrice, reason, onClose, onSuccess])

  const handleClose = useCallback(() => {
    if (!isPending) {
      setNewPrice(currentPrice)
      setReason('')
      setError(null)
      onClose()
    }
  }, [isPending, currentPrice, onClose])

  if (!isOpen) return null

  const priceDiff = newPrice - currentPrice

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-price-title"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: COLORS.overlay }}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm border overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
        <div className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.warningLight }}>
              <DollarSign className="w-5 h-5" style={{ color: COLORS.warning }} />
            </div>
            <h2
              id="adjust-price-title"
              className="text-xl font-bold font-heading"
              style={{ color: COLORS.textPrimary }}
            >
              Ajustar Precio
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl transition-colors disabled:opacity-50"
            style={{ color: COLORS.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.surfaceHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.textSecondary }}>Precio actual</span>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                {formatCurrencyCOP(currentPrice)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              Nuevo precio
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: COLORS.textMuted }}>
                $
              </span>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isPending}
                className="w-full h-11 pl-7 pr-3 rounded-xl border font-medium focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
                min="0"
                step="1000"
              />
            </div>
          </div>

          {priceDiff !== 0 && (
            <div className="flex justify-between items-center p-3 rounded-xl text-sm"
              style={{ 
                backgroundColor: priceDiff > 0 ? COLORS.successLight : COLORS.errorLight,
                color: priceDiff > 0 ? COLORS.success : COLORS.error,
              }}>
              <span className="font-medium">
                {priceDiff > 0 ? 'Aumento' : 'Reducción'}
              </span>
              <span className="font-bold">
                {priceDiff > 0 ? '+' : ''}{formatCurrencyCOP(priceDiff)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              Motivo del ajuste
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none disabled:opacity-50"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
              placeholder="Ej: Cliente pidió decoración especial"
              maxLength={200}
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
              disabled={isPending || !reason.trim()}
              className="flex-1 h-11 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: COLORS.warning }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {isPending ? (
                <>
                  <Spinner size="sm" />
                  Guardando...
                </>
              ) : (
                'Ajustar Precio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
