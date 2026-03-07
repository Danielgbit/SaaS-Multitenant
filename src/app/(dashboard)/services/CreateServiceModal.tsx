'use client'

import { useState, useTransition } from 'react'
import { X, Scissors, Clock, DollarSign, Loader2 } from 'lucide-react'
import { createService } from '@/actions/services/createService'

interface CreateServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateServiceModal({ isOpen, onClose }: CreateServiceModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const name = formData.get('name') as string
    const durationStr = formData.get('duration') as string
    const priceStr = formData.get('price') as string

    const duration = parseInt(durationStr, 10)
    const price = parseFloat(priceStr)

    if (isNaN(duration) || duration <= 0) {
      setError('La duración debe ser un número válido mayor a 0.')
      return
    }

    if (isNaN(price) || price < 0) {
      setError('El precio debe ser un número válido mayor o igual a 0.')
      return
    }

    startTransition(async () => {
      const result = await createService({ 
        name, 
        duration, 
        price 
      })

      if (!result.error) {
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-service-title"
    >
      {/* ── Overlay ── */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Dialog Panel ── */}
      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Scissors className="w-5 h-5" />
            </div>
            <h2
              id="create-service-title"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif"
            >
              Nuevo Servicio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 flex items-start gap-3 animate-in slide-in-from-top-2">
              <span className="text-red-600 dark:text-red-400 mt-0.5">⚠️</span>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Form Fields Container */}
          <div className="space-y-5">
            {/* Input: Name */}
            <div className="space-y-2">
              <label
                htmlFor="create-service-name"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
              >
                Nombre del servicio <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors">
                  <Scissors className="w-5 h-5" />
                </div>
                <input
                  id="create-service-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Corte de cabello, Spa facial"
                  className="w-full pl-12 pr-4 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Input: Duration */}
              <div className="space-y-2">
                <label
                  htmlFor="create-service-duration"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
                >
                  Duración (min) <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <input
                    id="create-service-duration"
                    name="duration"
                    type="number"
                    min="5"
                    step="5"
                    required
                    placeholder="30"
                    className="w-full pl-12 pr-4 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Input: Price */}
              <div className="space-y-2">
                <label
                  htmlFor="create-service-price"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
                >
                  Costo <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    id="create-service-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="10.00"
                    className="w-full pl-12 pr-4 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                'Crear servicio'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
