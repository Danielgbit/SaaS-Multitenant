'use client'

import { useState, useTransition, useCallback } from 'react'
import { X, CheckCircle2, Loader2, AlertCircle, Plus, Minus } from 'lucide-react'
import { markCompleted } from '@/actions/confirmations/markCompleted'
import type { MarkCompletedState } from '@/actions/confirmations/schemas'
import { toast } from 'sonner'

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

      toast.success('Servicio marcado como completado')
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
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2
              id="mark-completed-title"
              className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif"
            >
              Confirmar Servicio
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Cliente</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Servicio</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Precio base</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                ${basePrice.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Ajuste por extras (opcional)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustPrice(-10000)}
                disabled={priceAdjustment <= 0 || isPending}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isPending}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                placeholder="0"
                min="0"
                step="1000"
              />
              <button
                type="button"
                onClick={() => adjustPrice(10000)}
                disabled={isPending}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              decoration, extras, etc.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex justify-between items-center">
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                Precio Total
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                ${finalPrice.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notas para el asistente (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none disabled:opacity-50"
              placeholder="Decoración con gel..."
              maxLength={500}
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
              disabled={isPending}
              className="flex-1 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
