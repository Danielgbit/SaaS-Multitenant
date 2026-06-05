'use client'

import { Clock } from 'lucide-react'
import { ConfirmModal } from '@/components/ui'

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
  isOpen, onClose, onConfirm, time, employeeName, serviceName, reason,
}: ForceCreationModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={async () => { onConfirm() }}
      title="Horario fuera de disponibilidad"
      description={
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="text-left">
              <p className="text-sm">
                La hora seleccionada <span className="font-semibold">{time}</span> está fuera del horario normal de disponibilidad del empleado.
              </p>
              <div className="mt-2 space-y-0.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <p><span className="font-medium">Empleado:</span> {employeeName}</p>
                <p><span className="font-medium">Servicio:</span> {serviceName}</p>
              </div>
              {reason && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 italic">
                  &ldquo;{reason}&rdquo;
                </p>
              )}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Atención:</strong> Al confirmar, se creará un override temporal para este horario.
            </p>
          </div>
        </div>
      }
      confirmText="Crear de todas formas"
      variant="warning"
    />
  )
}
