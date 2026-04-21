'use client'

import { useState, useTransition, useCallback } from 'react'
import { X, Loader2, AlertCircle, DollarSign } from 'lucide-react'
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
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2
              id="adjust-price-title"
              className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif"
            >
              Ajustar Precio
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Precio actual</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrencyCOP(currentPrice)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nuevo precio
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                $
              </span>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isPending}
                className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                min="0"
                step="1000"
              />
            </div>
          </div>

          {priceDiff !== 0 && (
            <div className={`
              flex justify-between items-center p-3 rounded-xl text-sm
              ${priceDiff > 0 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }
            `}>
              <span className="font-medium">
                {priceDiff > 0 ? 'Aumento' : 'Reducción'}
              </span>
              <span className="font-bold">
                {priceDiff > 0 ? '+' : ''}{formatCurrencyCOP(priceDiff)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Motivo del ajuste
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none disabled:opacity-50"
              placeholder="Ej: Cliente pidió decoración especial"
              maxLength={200}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="flex-1 h-11 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
