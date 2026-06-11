'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
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

  if (!employee) return null
  const safeEmployee = employee

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await archiveEmployee(safeEmployee.id, reason || undefined)
      if (result.error) setError(result.error); else onClose()
    })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Archivar empleado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{employee.name}</p>
            {employee.phone && <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{employee.phone}</p>}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">El empleado quedará inactivo</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Podrás reactivarlo en cualquier momento.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="archive-reason" className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">Razón (opcional)</label>
          <textarea id="archive-reason" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Renuncia voluntaria" maxLength={500} rows={2}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm resize-none" />
          <p className="text-xs text-[#94A3B8] text-right">{reason.length}/500</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" variant="danger" disabled={isPending} loading={isPending} className="flex-1">
            Archivar empleado
          </Button>
        </div>
      </form>
    </Modal>
  )
}
