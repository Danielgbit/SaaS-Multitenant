'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, UserX, Loader2, AlertTriangle } from 'lucide-react'
import { archiveEmployee } from '@/actions/employees/archiveEmployee'
import type { Employee } from '@/types/employees'

interface DeleteEmployeePortalProps {
  employee: Employee | null
  onClose: () => void
}

export function DeleteEmployeePortal({ employee, onClose }: DeleteEmployeePortalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (employee) {
      setReason('')
      setError(null)
    }
  }, [employee])

  if (!employee || !isMounted) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!employee) return

    startTransition(async () => {
      const result = await archiveEmployee(employee.id, reason || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-employee-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800/40 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-500">
              <UserX className="w-5 h-5" />
            </div>
            <h2
              id="delete-employee-title"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif"
            >
              Archivar empleado
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancelar"
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div
              className="
                w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                text-lg font-bold
                bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 text-slate-500 dark:text-slate-400
              "
            >
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {employee.name}
              </p>
              {employee.phone && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {employee.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                El empleado quedará inactivo
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Sus datos se mantendrán. Podrás reactivarlo en cualquier momento.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 flex items-start gap-3 animate-in slide-in-from-top-2">
              <span className="text-red-600 dark:text-red-400 mt-0.5">⚠️</span>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="archive-reason"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
            >
              Razón (opcional)
            </label>
            <textarea
              id="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Renuncia voluntaria, Termino de contrato..."
              maxLength={500}
              rows={3}
              className="
                w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 
                bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 
                text-sm placeholder-slate-400 resize-none
                focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] 
                focus:border-transparent transition-all duration-200 shadow-sm
              "
            />
            <p className="text-xs text-slate-400 text-right">
              {reason.length}/500
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
            <button
              type="button"
              onClick={onClose}
              className="
                w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl 
                border border-slate-200 dark:border-slate-700 
                text-sm font-semibold text-slate-700 dark:text-slate-300 
                hover:bg-slate-50 dark:hover:bg-slate-800 
                transition-colors duration-200 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
                cursor-pointer
              "
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="
                w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl 
                bg-red-600 hover:bg-red-700 active:scale-[0.98]
                text-white text-sm font-semibold 
                shadow-md transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed 
                flex items-center justify-center gap-2 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                cursor-pointer
              "
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Archivando...</span>
                </>
              ) : (
                'Archivar empleado'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
