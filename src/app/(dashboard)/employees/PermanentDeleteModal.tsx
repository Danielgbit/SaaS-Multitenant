'use client'

import { useState, useEffect, useTransition } from 'react'
import { Trash2, AlertTriangle, Check, Calendar, FileText, Wrench, CreditCard, Clock } from 'lucide-react'
import { Modal, Button, Spinner } from '@/components/ui'
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

    let mounted = true

    countEmployeeRecords(employee.id)
      .then((counts) => {
        if (!mounted) return
        setRecordCounts(counts)
        setIsLoadingCounts(false)
      })
      .catch((error) => {
        if (!mounted) return
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

    return () => { mounted = false }
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
    <Modal isOpen={true} onClose={onClose} title="Eliminar permanentemente">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm">
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{employee.name}</p>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Esta acción no se puede deshacer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {recordCounts?.hasActiveAppointments && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Este empleado tiene citas activas</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">No se puede eliminar. Primero archívalo.</p>
            </div>
          </div>
        )}

        {!recordCounts?.hasActiveAppointments && itemsWithCount.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] mb-2">Se eliminará:</p>
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              {itemsWithCount.map(([key, count]) => {
                const config = RECORD_LABELS[key]
                const Icon = config.icon
                return (
                  <div key={key} className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <Check className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{count}</span>
                    <span>{config.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {itemsWithCount.length === 0 && !isLoadingCounts && !recordCounts?.hasActiveAppointments && (
          <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
            <p className="text-xs text-center text-[#64748B] dark:text-[#94A3B8]">Sin registros adicionales. Solo se eliminará su perfil.</p>
          </div>
        )}

        {isLoadingCounts && (
          <div className="flex justify-center py-3">
            <Spinner size="sm" />
          </div>
        )}

        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]"><span className="font-semibold text-amber-600 dark:text-amber-400">Nota:</span> Los appointments se conservarán.</p>
        </div>

        {error && !error.includes('citas activas') && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="perm-delete-confirm" className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">Escribe "ELIMINAR" para confirmar</label>
          <input id="perm-delete-confirm" type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR" autoComplete="off"
            className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-[#E2E8F0] dark:border-[#475569] bg-white dark:bg-[#111827] text-center font-mono text-base uppercase tracking-wider placeholder-[#CBD5E1] dark:placeholder-[#475569]" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" variant="danger" disabled={!isConfirmValid || isPending || recordCounts?.hasActiveAppointments || isLoadingCounts} loading={isPending} className="flex-1">
            Eliminar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
