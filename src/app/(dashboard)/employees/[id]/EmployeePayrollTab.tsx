'use client'

import { useState } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Briefcase, Percent, DollarSign, AlertTriangle, CheckCircle2, Clock, Save } from 'lucide-react'
import { Spinner } from '@/components/ui'
import type { PaymentType, ContractType, SalaryFrequency, EmploymentType } from '@/types/employees'
import { updateEmployeePayroll } from '@/actions/employees/updateEmployeePayroll'

type EmployeeWithPayroll = {
  id: string
  name: string
  default_commission_rate: number
  payment_type: PaymentType
  contract_type?: string
  base_salary: number | null
  has_transport_subsidy?: boolean
  force_transport_subsidy?: boolean
  salary_frequency: SalaryFrequency | null
  max_debt_limit: number
  debt_warning_threshold: number
  employment_type?: string | null
  part_time_percentage?: number | null
}

interface EmployeePayrollTabProps {
  employee: EmployeeWithPayroll
  organizationId: string
}

const contractTypeOptions: { value: ContractType; label: string; description: string }[] = [
  { value: 'prestacion', label: 'Prestación de Servicios', description: 'Sin deducciones de salud/pensión. Común en barberos, esteticistas, especialistas independientes.' },
  { value: 'laboral', label: 'Contrato Laboral', description: 'Con deducciones de 8% (salud + pensión). Para empleados formales como recepcionistas, auxiliares.' },
]

const paymentTypeOptions: { value: PaymentType; label: string; description: string }[] = [
  { value: 'porcentaje', label: 'Solo Comisión', description: 'Paga únicamente por servicios realizados. Recomendado para barberos, esteticistas.' },
  { value: 'fijo', label: 'Sueldo Fijo', description: 'Paga un salario fijo independientemente de servicios. Para recepcionistas, personal administrativo.' },
  { value: 'mixed', label: 'Mixto', description: 'Sueldo base fijo + comisión por servicios extra. Para empleados que combinan roles.' },
]

const salaryFrequencyOptions: { value: SalaryFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
]

export function EmployeePayrollTab({ employee, organizationId }: EmployeePayrollTabProps) {
  const COLORS = useThemeColors()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [contractType, setContractType] = useState<ContractType>(employee.contract_type as ContractType || 'prestacion')
  const [commissionRate, setCommissionRate] = useState(employee.default_commission_rate || 60)
  const [paymentType, setPaymentType] = useState<PaymentType>(employee.payment_type || 'porcentaje')
  const [baseSalary, setBaseSalary] = useState(employee.base_salary?.toString() || '')
  const [hasTransportSubsidy, setHasTransportSubsidy] = useState(employee.has_transport_subsidy || false)
  const [forceTransportSubsidy, setForceTransportSubsidy] = useState(employee.force_transport_subsidy || false)
  const [salaryFrequency, setSalaryFrequency] = useState<SalaryFrequency>(
    employee.salary_frequency || 'monthly'
  )
  const [maxDebtLimit, setMaxDebtLimit] = useState(employee.max_debt_limit?.toString() || '200')
  const [debtWarningThreshold, setDebtWarningThreshold] = useState(
    employee.debt_warning_threshold?.toString() || '80'
  )
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    (employee.employment_type as EmploymentType) || 'full_time'
  )
  const [partTimePercentage, setPartTimePercentage] = useState(
    employee.part_time_percentage || 100
  )

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updateEmployeePayroll({
      id: employee.id,
      contract_type: contractType,
      default_commission_rate: commissionRate,
      payment_type: paymentType,
      base_salary: baseSalary ? parseFloat(baseSalary) : null,
      has_transport_subsidy: hasTransportSubsidy,
      force_transport_subsidy: forceTransportSubsidy,
      salary_frequency: paymentType === 'fijo' || paymentType === 'mixed' ? salaryFrequency : null,
      max_debt_limit: parseFloat(maxDebtLimit),
      debt_warning_threshold: parseFloat(debtWarningThreshold),
      employment_type: employmentType,
      part_time_percentage: employmentType === 'part_time' ? partTimePercentage : 100,
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
      {/* Contract Type */}
      <div>
        <label
          className="block text-sm font-medium mb-3"
          style={{ color: COLORS.textPrimary }}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
            Tipo de Vinculación
          </div>
        </label>
        <div className="space-y-2">
          {contractTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setContractType(opt.value)}
              className="w-full p-4 rounded-xl border-2 text-left transition-all duration-200"
              style={{
                borderColor: contractType === opt.value ? COLORS.primary : COLORS.border,
                backgroundColor: contractType === opt.value ? COLORS.primary + '08' : COLORS.surface,
              }}
            >
              <p
                className="font-medium"
                style={{ color: contractType === opt.value ? COLORS.primary : COLORS.textPrimary }}
              >
                {opt.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                {opt.description}
              </p>
            </button>
          ))}
        </div>
        {contractType === 'laboral' && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.success }}>
            <CheckCircle2 className="w-3 h-3" />
            Se aplicarán deducciones de salud (4%) y pensión (4%)
          </p>
        )}
        {contractType === 'prestacion' && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
            Sin deducciones de ley. El empleado gestiona sus propios aportes.
          </p>
        )}
      </div>

      {/* Employment Type - Only for laboral contracts */}
      {contractType === 'laboral' && (
        <div>
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: COLORS.textPrimary }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: COLORS.primary }} />
              Tipo de Jornada
            </div>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setEmploymentType('full_time')
                setPartTimePercentage(100)
              }}
              className="p-4 rounded-xl border-2 text-left transition-all duration-200"
              style={{
                borderColor: employmentType === 'full_time' ? COLORS.primary : COLORS.border,
                backgroundColor: employmentType === 'full_time' ? COLORS.primary + '08' : COLORS.surface,
              }}
            >
              <p
                className="font-medium"
                style={{ color: employmentType === 'full_time' ? COLORS.primary : COLORS.textPrimary }}
              >
                Tiempo Completo
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                100% del salario
              </p>
            </button>
            <button
              type="button"
              onClick={() => setEmploymentType('part_time')}
              className="p-4 rounded-xl border-2 text-left transition-all duration-200"
              style={{
                borderColor: employmentType === 'part_time' ? COLORS.primary : COLORS.border,
                backgroundColor: employmentType === 'part_time' ? COLORS.primary + '08' : COLORS.surface,
              }}
            >
              <p
                className="font-medium"
                style={{ color: employmentType === 'part_time' ? COLORS.primary : COLORS.textPrimary }}
              >
                Medio Tiempo
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                % del salario mínimo
              </p>
            </button>
          </div>

          {employmentType === 'part_time' && (
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.textPrimary }}
              >
                Porcentaje del salario mínimo
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={partTimePercentage}
                  onChange={(e) => setPartTimePercentage(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${partTimePercentage}%, ${COLORS.border} ${partTimePercentage}%, ${COLORS.border} 100%)`,
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
                  {partTimePercentage}%
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
                El salario y auxilio de transporte se calcularán proporcional al porcentaje
              </p>
            </div>
          )}
        </div>
      )}

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
            Modalidad de Pago
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
      {paymentType !== 'porcentaje' && (
        <div
          className="p-4 rounded-xl space-y-4"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Salario Base
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
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
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

          {/* Transport Subsidy */}
          <div className="space-y-3 pt-2">
            <label
              className="flex items-center gap-3 cursor-pointer"
              style={{ color: COLORS.textPrimary }}
            >
              <input
                type="checkbox"
                checked={hasTransportSubsidy}
                onChange={(e) => setHasTransportSubsidy(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm">Recibe auxilio de transporte</span>
            </label>

            {hasTransportSubsidy && (
              <label
                className="flex items-center gap-3 cursor-pointer ml-8"
                style={{ color: COLORS.textSecondary }}
              >
                <input
                  type="checkbox"
                  checked={forceTransportSubsidy}
                  onChange={(e) => setForceTransportSubsidy(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs">Forzar aunque gane más de 2 SMMLV</span>
              </label>
            )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Spinner size="sm" className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}