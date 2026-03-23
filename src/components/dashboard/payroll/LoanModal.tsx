'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  X,
  DollarSign,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react'
import { createEmployeeLoan } from '@/actions/payroll/createEmployeeLoan'
import type { LoanConcept } from '@/types/payroll'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}

type Employee = {
  id: string
  name: string
  max_debt_limit: number | null
  debt_warning_threshold: number
  total_pending_debt: number
}

const conceptOptions: { value: LoanConcept; label: string }[] = [
  { value: 'passage', label: 'Pasaje' },
  { value: 'food', label: 'Comida' },
  { value: 'product', label: 'Producto del spa' },
  { value: 'advance', label: 'Anticipo' },
  { value: 'other', label: 'Otro' },
]

interface LoanModalProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  organizationId: string
  onClose: () => void
}

export function LoanModal({
  employees,
  selectedEmployee,
  organizationId,
  onClose,
}: LoanModalProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const [employeeId, setEmployeeId] = useState(selectedEmployee?.id || '')
  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState<LoanConcept>('advance')
  const [notes, setNotes] = useState('')
  const [interestRate, setInterestRate] = useState('0')

  useEffect(() => {
    setMounted(true)
    if (selectedEmployee) {
      setEmployeeId(selectedEmployee.id)
    }
  }, [selectedEmployee])

  if (!mounted) return null

  const currentEmployee = employees.find((e) => e.id === employeeId)
  const currentDebt = currentEmployee?.total_pending_debt || 0
  const debtLimit = currentEmployee?.max_debt_limit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWarning(null)
    setLoading(true)

    const result = await createEmployeeLoan({
      employee_id: employeeId,
      amount: parseFloat(amount),
      concept,
      notes: notes || undefined,
      interest_rate: parseFloat(interestRate) || 0,
    })

    setLoading(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    } else {
      setError(result.error || 'Error al registrar el préstamo')
      if (result.warning) {
        setWarning(result.warning)
      }
    }
  }

  const wouldExceedLimit =
    debtLimit && parseFloat(amount) > 0 && currentDebt + parseFloat(amount) > debtLimit

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: COLORS.overlay }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{
          backgroundColor: COLORS.surface,
          animation: 'scale-in 0.2s ease-out',
        }}
      >
        <style jsx>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        {/* Header */}
        <div
          className="relative p-6 overflow-hidden"
          style={{
            background: COLORS.primary,
          }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{
              backgroundColor: '#FFFFFF',
              transform: 'translate(30%, -30%)',
            }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2
                  className="text-xl font-semibold text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {success ? '¡Registrado!' : 'Registrar Préstamo'}
                </h2>
                <p className="text-xs text-white/80">Agrega un nuevo préstamo o débito</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/20"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: COLORS.successLight }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: COLORS.success }} />
              </div>
              <p className="text-lg font-medium" style={{ color: COLORS.textPrimary }}>
                Préstamo registrado correctamente
              </p>
              <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
                Redirigiendo...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee Select */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  Empleado
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value)
                    setError(null)
                  }}
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.surface,
                  }}
                  required
                >
                  <option value="">Seleccionar empleado...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  Monto
                </label>
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: COLORS.textMuted }}
                  >
                    COP
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      setError(null)
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                    style={{
                      borderColor: wouldExceedLimit ? COLORS.error : COLORS.border,
                      color: COLORS.textPrimary,
                      backgroundColor: COLORS.surface,
                    }}
                    placeholder="0"
                    required
                  />
                </div>

                {/* Debt Info */}
                {currentEmployee && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span style={{ color: COLORS.textMuted }}>
                      Deuda actual: COP {currentDebt.toLocaleString('es-CO')}
                      {debtLimit && ` / COP ${debtLimit.toLocaleString('es-CO')}`}
                    </span>
                    {wouldExceedLimit && (
                      <span className="flex items-center gap-1" style={{ color: COLORS.error }}>
                        <AlertTriangle className="w-3 h-3" />
                        Excederá el límite
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Concept */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  Concepto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {conceptOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConcept(opt.value)}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor:
                          concept === opt.value ? COLORS.primary : COLORS.surfaceSubtle,
                        color: concept === opt.value ? '#FFFFFF' : COLORS.textSecondary,
                        border: `1px solid ${
                          concept === opt.value ? COLORS.primary : COLORS.border
                        }`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.surface,
                  }}
                  rows={2}
                  placeholder="Descripción adicional..."
                />
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Tasa de interés
                  </label>
                  <div className="relative inline-flex">
                    <HelpCircle className="w-3 h-3 cursor-help" style={{ color: COLORS.textMuted }} />
                    <span
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity"
                      style={{
                        backgroundColor: COLORS.isDark ? '#1E293B' : '#0F172A',
                        color: '#fff',
                      }}
                    >
                      0% = sin interés
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                      backgroundColor: COLORS.surface,
                    }}
                    placeholder="0"
                  />
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: COLORS.textMuted }}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="p-3 rounded-xl flex items-center gap-2"
                  style={{ backgroundColor: COLORS.errorLight }}
                >
                  <AlertTriangle className="w-4 h-4" style={{ color: COLORS.error }} />
                  <span className="text-sm" style={{ color: COLORS.error }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Warning Message */}
              {warning && (
                <div
                  className="p-3 rounded-xl flex items-center gap-2"
                  style={{ backgroundColor: COLORS.warningLight }}
                >
                  <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
                  <span className="text-sm" style={{ color: COLORS.warning }}>
                    {warning}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors duration-200"
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textSecondary,
                    backgroundColor: 'transparent',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !employeeId || !amount}
                  className="flex-1 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                  {loading ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
