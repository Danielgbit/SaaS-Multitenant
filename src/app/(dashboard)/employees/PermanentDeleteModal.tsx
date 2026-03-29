'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Trash2, Loader2, AlertTriangle, Check, Calendar, FileText, Wrench, CreditCard, Clock } from 'lucide-react'
import { permanentDeleteEmployee } from '@/actions/employees/permanentDeleteEmployee'
import { countEmployeeRecords, type EmployeeRecordCounts } from '@/actions/employees/countEmployeeRecords'
import type { Employee } from '@/types/employees'

interface PermanentDeleteModalProps {
  employee: Employee | null
  onClose: () => void
}

const RECORD_LABELS: Record<keyof Omit<EmployeeRecordCounts, 'hasActiveAppointments'>, { label: string; icon: typeof Calendar }> = {
  appointments: { label: 'citas históricas', icon: Calendar },
  confirmations: { label: 'confirmaciones', icon: FileText },
  availability: { label: 'registros de disponibilidad', icon: Clock },
  services: { label: 'servicios asignados', icon: Wrench },
  loans: { label: 'préstamos', icon: CreditCard },
  receipts: { label: 'recibos de nómina', icon: CreditCard },
}

export function PermanentDeleteModal({ employee, onClose }: PermanentDeleteModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [recordCounts, setRecordCounts] = useState<EmployeeRecordCounts | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)

  useEffect(() => {
    if (!employee) return

    setIsLoadingCounts(true)
    setRecordCounts(null)
    
    countEmployeeRecords(employee.id)
      .then((counts) => {
        setRecordCounts(counts)
        setIsLoadingCounts(false)
      })
      .catch((error) => {
        console.error('Error loading record counts:', error)
        setRecordCounts({
          appointments: 0,
          confirmations: 0,
          availability: 0,
          services: 0,
          loans: 0,
          receipts: 0,
          hasActiveAppointments: false,
        })
        setIsLoadingCounts(false)
      })
  }, [employee])

  if (!employee) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (confirmText !== 'ELIMINAR') return

    startTransition(async () => {
      const result = await permanentDeleteEmployee(employee.id, employee.organization_id)
      if (!result.success && result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const isConfirmValid = confirmText === 'ELIMINAR'
  const recordKeys: (keyof Omit<EmployeeRecordCounts, 'hasActiveAppointments'>)[] = [
    'appointments', 'confirmations', 'availability', 'services', 'loans', 'receipts'
  ]
  
  const itemsWithCount = recordCounts
    ? recordKeys
        .filter(key => recordCounts[key] > 0)
        .map(key => [key, recordCounts[key]] as [typeof key, number])
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permanent-delete-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md border-2 border-red-500 overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <h2
                id="permanent-delete-title"
                className="text-xl font-bold text-white"
              >
                Eliminar permanentemente
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/30">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                {employee.name}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          {recordCounts?.hasActiveAppointments && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Este empleado tiene citas activas
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  No se puede eliminar. Primero archívalo para cancelar o reprogramar las citas.
                </p>
              </div>
            </div>
          )}

          {!recordCounts?.hasActiveAppointments && itemsWithCount.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Se eliminará:
              </p>
              <ul className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                {itemsWithCount.map(([key, count]) => {
                  const config = RECORD_LABELS[key]
                  const Icon = config.icon
                  return (
                    <li key={key} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-slate-200">{count}</span>
                      <span>{config.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {itemsWithCount.length === 0 && !isLoadingCounts && !recordCounts?.hasActiveAppointments && (
            <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Este empleado no tiene registros adicionales. Solo se eliminará su perfil del sistema.
              </p>
            </div>
          )}

          {isLoadingCounts && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}

          <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Nota:</span>
              <span>Los appointments se conservarán con el nombre del empleado eliminado.</span>
            </p>
          </div>

          {error && !error.includes('citas activas') && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
              <span className="text-red-600 dark:text-red-400 mt-0.5">⚠️</span>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="confirm-delete"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Escribe &ldquo;ELIMINAR&rdquo; para confirmar
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              autoComplete="off"
              className="
                w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600
                focus:ring-2 focus:ring-red-500 focus:border-red-500
                bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center
                font-mono text-lg tracking-wider uppercase
                placeholder-slate-300 dark:placeholder-slate-500
                transition-all duration-200 shadow-sm
              "
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl
                border-2 border-slate-200 dark:border-slate-600
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
              disabled={!isConfirmValid || isPending || recordCounts?.hasActiveAppointments || isLoadingCounts}
              className="
                w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl
                bg-gradient-to-r from-red-600 to-red-700
                hover:from-red-700 hover:to-red-800
                active:scale-[0.98]
                text-white text-sm font-bold uppercase tracking-wide
                shadow-lg shadow-red-500/30
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                cursor-pointer
              "
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                'Eliminar'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
