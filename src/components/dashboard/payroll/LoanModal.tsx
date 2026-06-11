'use client'

import { useState } from 'react'
import { DollarSign, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { createEmployeeLoan } from '@/actions/payroll/createEmployeeLoan'
import type { LoanConcept } from '@/types/payroll'

type Employee = {
  id: string; name: string; max_debt_limit: number | null
  debt_warning_threshold: number; total_pending_debt: number
}

const conceptOptions: { value: LoanConcept; label: string }[] = [
  { value: 'passage', label: 'Pasaje' }, { value: 'food', label: 'Comida' },
  { value: 'product', label: 'Producto del spa' }, { value: 'advance', label: 'Anticipo' },
  { value: 'other', label: 'Otro' },
]

interface LoanModalProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  organizationId: string
  onClose: () => void
}

export function LoanModal({ employees, selectedEmployee, organizationId, onClose }: LoanModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState(selectedEmployee?.id || '')
  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState<LoanConcept>('advance')
  const [notes, setNotes] = useState('')
  const [interestRate, setInterestRate] = useState('0')

  const currentEmployee = employees.find((e) => e.id === employeeId)
  const currentDebt = currentEmployee?.total_pending_debt || 0
  const debtLimit = currentEmployee?.max_debt_limit
  const wouldExceedLimit = debtLimit && parseFloat(amount) > 0 && currentDebt + parseFloat(amount) > debtLimit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setWarning(null); setLoading(true)
    const result = await createEmployeeLoan({
      employee_id: employeeId, amount: parseFloat(amount), concept,
      notes: notes || undefined, interest_rate: parseFloat(interestRate) || 0,
    })
    setLoading(false)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => { onClose(); window.location.reload() }, 1500)
    } else {
      setError(result.error || 'Error al registrar el préstamo')
      if (result.warning) setWarning(result.warning)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={success ? '¡Registrado!' : 'Registrar Préstamo'}>
      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-base font-medium text-[#0F172A] dark:text-[#F1F5F9]">Préstamo registrado correctamente</p>
          <p className="text-xs mt-1 text-[#64748B] dark:text-[#94A3B8]">Redirigiendo...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Empleado</label>
            <select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setError(null) }}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm" required>
              <option value="">Seleccionar empleado...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Monto</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">COP</span>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null) }}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm ${wouldExceedLimit ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#334155]'} bg-white dark:bg-[#111827]`}
                placeholder="0" required />
            </div>
            {currentEmployee && (
              <p className="text-xs mt-1 text-[#64748B] dark:text-[#94A3B8]">
                Deuda actual: COP {currentDebt.toLocaleString('es-CO')}
                {debtLimit && ` / COP ${debtLimit.toLocaleString('es-CO')}`}
                {wouldExceedLimit && <span className="text-red-500 ml-2">Excederá el límite</span>}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Concepto</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {conceptOptions.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setConcept(opt.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    concept === opt.value ? 'bg-[#0F4C5C] dark:bg-[#38BDF8] text-white' : 'bg-[#F8FAFC] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm resize-none" rows={2} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Tasa de interés</label>
              <HelpCircle className="w-3 h-3 text-[#94A3B8]" aria-label="0% = sin interés" />
            </div>
            <div className="relative">
              <input type="number" step="0.1" min="0" max="100" value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-4 py-3 pr-8 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">%</span>
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">{error}</div>}
          {warning && <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400">{warning}</div>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading || !employeeId || !amount} loading={loading} icon={<DollarSign className="w-4 h-4" />} className="flex-1">
              Registrar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
