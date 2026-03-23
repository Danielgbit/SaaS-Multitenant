'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  DollarSign,
  Percent,
  TrendingUp,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { updateEmployeePayroll } from '@/actions/employees/updateEmployeePayroll'
import type { Employee, PaymentType, SalaryFrequency } from '@/types/employees'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
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
    isDark,
  }
}

type EmployeeWithPayroll = Employee & {
  default_commission_rate: number
  payment_type: PaymentType
  fixed_salary: number | null
  salary_frequency: SalaryFrequency | null
  max_debt_limit: number
  debt_warning_threshold: number
}

interface EmployeePayrollTabProps {
  employee: EmployeeWithPayroll
  organizationId: string
}

const paymentTypeOptions: { value: PaymentType; label: string; description: string }[] = [
  { value: 'commission', label: 'Solo Comisión', description: 'Paga únicamente por servicios realizados' },
  { value: 'salary', label: 'Sueldo Fijo', description: 'Paga un salario fijo independientemente de servicios' },
  { value: 'mixed', label: 'Mixto', description: 'Sueldo fijo + comisión por servicios extra' },
]

const salaryFrequencyOptions: { value: SalaryFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
]

export function EmployeePayrollTab({ employee, organizationId }: EmployeePayrollTabProps) {
  const COLORS = useColors()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [commissionRate, setCommissionRate] = useState(employee.default_commission_rate || 60)
  const [paymentType, setPaymentType] = useState<PaymentType>(employee.payment_type || 'commission')
  const [fixedSalary, setFixedSalary] = useState(employee.fixed_salary?.toString() || '')
  const [salaryFrequency, setSalaryFrequency] = useState<SalaryFrequency>(
    employee.salary_frequency || 'weekly'
  )
  const [maxDebtLimit, setMaxDebtLimit] = useState(employee.max_debt_limit?.toString() || '200')
  const [debtWarningThreshold, setDebtWarningThreshold] = useState(
    employee.debt_warning_threshold?.toString() || '80'
  )

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updateEmployeePayroll({
      id: employee.id,
      default_commission_rate: commissionRate,
      payment_type: paymentType,
      fixed_salary: fixedSalary ? parseFloat(fixedSalary) : null,
      salary_frequency: paymentType === 'salary' ? salaryFrequency : null,
      max_debt_limit: parseFloat(maxDebtLimit),
      debt_warning_threshold: parseFloat(debtWarningThreshold),
    })

    setSaving(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al guardar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Commission Rate */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: COLORS.textPrimary }}
        >
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4" style={{ color: COLORS.primary }} />
            Porcentaje de Comisión
          </div>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${commissionRate}%, ${COLORS.border} ${commissionRate}%, ${COLORS.border} 100%)`,
            }}
          />
          <div
            className="w-20 px-4 py-2 rounded-xl border text-center font-semibold"
            style={{
              borderColor: COLORS.border,
              color: COLORS.primary,
              backgroundColor: COLORS.surface,
            }}
          >
            {commissionRate}%
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Porcentaje que recibe el empleado sobre el valor de cada servicio
        </p>
      </div>

      {/* Payment Type */}
      <div>
        <label
          className="block text-sm font-medium mb-3"
          style={{ color: COLORS.textPrimary }}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" style={{ color: COLORS.primary }} />
            Tipo de Pago
          </div>
        </label>
        <div className="space-y-2">
          {paymentTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPaymentType(opt.value)}
              className="w-full p-4 rounded-xl border-2 text-left transition-all duration-200"
              style={{
                borderColor: paymentType === opt.value ? COLORS.primary : COLORS.border,
                backgroundColor: paymentType === opt.value ? COLORS.primary + '08' : COLORS.surface,
              }}
            >
              <p
                className="font-medium"
                style={{ color: paymentType === opt.value ? COLORS.primary : COLORS.textPrimary }}
              >
                {opt.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                {opt.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Salary (if applicable) */}
      {paymentType !== 'commission' && (
        <div
          className="p-4 rounded-xl space-y-4"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Sueldo Fijo
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
                value={fixedSalary}
                onChange={(e) => setFixedSalary(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  backgroundColor: COLORS.surface,
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Frecuencia de Pago
            </label>
            <select
              value={salaryFrequency}
              onChange={(e) => setSalaryFrequency(e.target.value as SalaryFrequency)}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
            >
              {salaryFrequencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Debt Settings */}
      <div>
        <label
          className="block text-sm font-medium mb-3"
          style={{ color: COLORS.textPrimary }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
            Límite de Deuda
          </div>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: COLORS.textMuted }}
            >
              Límite máximo
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
                step="1"
                min="0"
                value={maxDebtLimit}
                onChange={(e) => setMaxDebtLimit(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-xl border text-sm"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  backgroundColor: COLORS.surface,
                }}
              />
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: COLORS.textMuted }}
            >
              Alerta al (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="5"
                min="0"
                max="100"
                value={debtWarningThreshold}
                onChange={(e) => setDebtWarningThreshold(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border text-sm"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  backgroundColor: COLORS.surface,
                }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: COLORS.textMuted }}
              >
                %
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          El sistema alertará cuando la deuda alcance este porcentaje del límite
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.successLight }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.success }}>¡Configuración guardada correctamente!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.errorLight }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
          <span style={{ color: COLORS.error }}>{error}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2"
          style={{ backgroundColor: COLORS.primary }}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}
