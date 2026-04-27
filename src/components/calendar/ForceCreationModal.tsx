'use client'

import { AlertTriangle, Loader2, X, Clock } from 'lucide-react'

interface ForceCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending?: boolean
  time: string
  employeeName: string
  serviceName: string
  reason?: string
}

export function ForceCreationModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
  time,
  employeeName,
  serviceName,
  reason,
}: ForceCreationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 border-b border-amber-100 dark:border-amber-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  Horario fuera de disponibilidad
                </h2>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Confirmación requerida
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-200">
                La hora seleccionada <span className="font-semibold">{time}</span> está fuera del horario normal de disponibilidad del empleado.
              </p>
              <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-medium">Empleado:</span> {employeeName}</p>
                <p><span className="font-medium">Servicio:</span> {serviceName}</p>
              </div>
              {reason && (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-300 italic">
                  &quot;{reason}&quot;
                </p>
              )}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Atención:</strong> Al confirmar, se creará un override temporal para este horario y la cita se registrará normalmente en el sistema.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear de todas formas
          </button>
        </div>
      </div>
    </div>
  )
}
