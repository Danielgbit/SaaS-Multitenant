'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Copy,
  Plus,
  Pencil,
  X,
  Briefcase,
  Percent
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

function useColors() {
  return useThemeColors()
}

const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

interface Employee {
  id: string
  name: string
  contract_type: string | null
  payment_type: string | null
  percentage: number | null
  base_salary: number | null
  employment_type?: string
  part_time_percentage?: number
}

interface CreatePeriodPageProps {
  organizationId: string
  employees: Employee[]
  existingPeriods: string[]
  previousPeriod?: {
    period: string
    total_employees: number
  } | null
}

type CreationMode = 'select' | 'copy' | 'empty'
type BulkEditField = 'contract_type' | 'payment_type'

export function CreatePeriodPage({
  organizationId,
  employees,
  existingPeriods,
  previousPeriod,
}: CreatePeriodPageProps) {
  const COLORS = useColors()
  const router = useRouter()
  const now = new Date()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creationMode, setCreationMode] = useState<CreationMode>('select')
  const [showEmployeeSelection, setShowEmployeeSelection] = useState(false)
  const [editableEmployees, setEditableEmployees] = useState<Employee[]>(employees)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'))
  const [notes, setNotes] = useState('')

  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(editableEmployees.map(e => e.id))
  )
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkEditField, setBulkEditField] = useState<BulkEditField>('contract_type')
  const [bulkEditValue, setBulkEditValue] = useState<string>('')

  const period = `${selectedYear}-${selectedMonth}`
  const periodExists = existingPeriods.includes(period)
  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''
  const periodLabel = `${monthLabel} ${selectedYear}`

  const previousPeriodLabel = useMemo(() => {
    if (!previousPeriod) return null
    const [year, month] = previousPeriod.period.split('-')
    const monthName = MONTHS.find(m => m.value === month)?.label || ''
    return `${monthName} ${year}`
  }, [previousPeriod])

  const groupedEmployees = useMemo(() => {
    const groups: Record<string, Employee[]> = {
      laboral_full: [],
      laboral_part: [],
      prestacion: [],
    }
    editableEmployees.forEach(emp => {
      if (emp.contract_type === 'laboral') {
        if (emp.employment_type === 'part_time') {
          groups.laboral_part.push(emp)
        } else {
          groups.laboral_full.push(emp)
        }
      } else {
        groups.prestacion.push(emp)
      }
    })
    return groups
  }, [employees])

  const selectedCount = selectedEmployees.size
  const totalCount = employees.length

  const handleSelectAll = () => {
    if (selectedCount === totalCount) {
      setSelectedEmployees(new Set())
    } else {
      setSelectedEmployees(new Set(editableEmployees.map(e => e.id)))
    }
  }

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCopyPrevious = () => {
    setCreationMode('copy')
    setShowEmployeeSelection(true)
  }

  const handleStartEmpty = () => {
    setCreationMode('empty')
    setShowEmployeeSelection(true)
  }

  const handleBulkEdit = () => {
    if (selectedCount === 0) return
    setShowBulkEdit(true)
    setBulkEditField('contract_type')
    setBulkEditValue('')
  }

  const applyBulkEdit = () => {
    if (!bulkEditValue) return

    setEmployees(prev => prev.map(emp => {
      if (!selectedEmployees.has(emp.id)) return emp
      if (bulkEditField === 'contract_type') {
        return { ...emp, contract_type: bulkEditValue }
      } else if (bulkEditField === 'payment_type') {
        return { ...emp, payment_type: bulkEditValue }
      }
      return emp
    }))
    setShowBulkEdit(false)
  }

  const handleCreate = async () => {
    if (periodExists) return
    setLoading(true)
    setError(null)

    try {
      const { createPayrollPeriod } = await import('@/actions/payroll/createPayrollPeriod')
      const result = await createPayrollPeriod({
        organization_id: organizationId,
        period,
        notes: notes || undefined,
        employee_ids: Array.from(selectedEmployees),
      })

      if (result.success && result.data) {
        router.push(`/payroll/${result.data.period_id}`)
      } else {
        setError(result.error || 'Error al crear período')
      }
    } catch (e) {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!showEmployeeSelection) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        `}</style>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/payroll"
              className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ color: COLORS.textSecondary }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
                Nómina
              </p>
              <h1
                className="text-2xl font-bold"
                style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
              >
                Crear Período
              </h1>
            </div>
          </div>

          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: COLORS.primaryGradient }}
          >
            <div className="p-6 md:p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h2
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {periodLabel}
              </h2>
              <p className="text-white/70 text-sm">
                ¿Cómo quieres crear este período?
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Seleccionar Período
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                  Mes
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border transition-colors"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                  }}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                  Año
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border transition-colors"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                  }}
                >
                  <option value={now.getFullYear()}>{now.getFullYear()}</option>
                  <option value={now.getFullYear() + 1}>{now.getFullYear() + 1}</option>
                </select>
              </div>
            </div>

            {periodExists && (
              <div
                className="mt-4 p-4 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: COLORS.error + '15' }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: COLORS.error }} />
                <p className="text-sm" style={{ color: COLORS.error }}>
                  Ya existe un período para {periodLabel}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {previousPeriod && (
              <button
                onClick={handleCopyPrevious}
                disabled={periodExists}
                className="w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-50"
                style={{
                  borderColor: COLORS.primary,
                  backgroundColor: COLORS.surface,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <Copy className="w-6 h-6" style={{ color: COLORS.primary }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
                      Copiar de {previousPeriodLabel}
                    </p>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>
                      Usa los {previousPeriod.total_employees} empleados del período anterior
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                </div>
              </button>
            )}

            <button
              onClick={handleStartEmpty}
              disabled={periodExists}
              className="w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-50"
              style={{
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: COLORS.surfaceSubtle }}
                >
                  <Plus className="w-6 h-6" style={{ color: COLORS.textSecondary }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
                    Crear desde cero
                  </p>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>
                    Selecciona los empleados manualmente
                  </p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowEmployeeSelection(false)}
            className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textSecondary }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
              Nómina
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Seleccionar Empleados
            </h1>
          </div>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: COLORS.primaryGradient }}
        >
          <div className="p-6 md:p-8 text-center">
            <h2
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {periodLabel}
            </h2>
            <p className="text-white/70 text-sm">
              {selectedCount} de {totalCount} empleados seleccionados
            </p>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: COLORS.surfaceSubtle, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors"
              style={{
                borderColor: selectedCount === totalCount ? COLORS.primary : COLORS.border,
                backgroundColor: selectedCount === totalCount ? COLORS.primary + '15' : 'transparent',
              }}
            >
              {selectedCount === totalCount && <CheckCircle className="w-4 h-4" style={{ color: COLORS.primary }} />}
            </button>
            <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
              {selectedCount === totalCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </span>
          </div>
          <button
            onClick={handleBulkEdit}
            disabled={selectedCount === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.textSecondary,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Pencil className="w-4 h-4" />
            Cambiar tipo
          </button>
        </div>

        <div className="space-y-6">
          {groupedEmployees.laboral_full.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👔</span>
                <span className="text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                  Contrato Laboral · Tiempo Completo
                </span>
              </div>
              <div className="space-y-2">
                {groupedEmployees.laboral_full.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => toggleEmployee(emp.id)}
                    COLORS={COLORS}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedEmployees.laboral_part.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👔</span>
                <span className="text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                  Contrato Laboral · Medio Tiempo
                </span>
              </div>
              <div className="space-y-2">
                {groupedEmployees.laboral_part.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => toggleEmployee(emp.id)}
                    COLORS={COLORS}
                    showPartTime
                  />
                ))}
              </div>
            </div>
          )}

          {groupedEmployees.prestacion.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📄</span>
                <span className="text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                  Prestación de Servicios
                </span>
              </div>
              <div className="space-y-2">
                {groupedEmployees.prestacion.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => toggleEmployee(emp.id)}
                    COLORS={COLORS}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agregar notas sobre este período..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border resize-none"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          />
        </div>

        {error && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: COLORS.error + '15' }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: COLORS.error }} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowEmployeeSelection(false)}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: COLORS.surfaceSubtle,
              color: COLORS.textSecondary,
            }}
          >
            Volver
          </button>
          <button
            onClick={handleCreate}
            disabled={periodExists || selectedCount === 0 || loading}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: COLORS.primary }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </span>
            ) : `Crear Período (${selectedCount})`}
          </button>
        </div>
      </div>

      {showBulkEdit && (
        <BulkEditModal
          COLORS={COLORS}
          selectedCount={selectedCount}
          field={bulkEditField}
          value={bulkEditValue}
          onFieldChange={setBulkEditField}
          onValueChange={setBulkEditValue}
          onCancel={() => setShowBulkEdit(false)}
          onApply={applyBulkEdit}
        />
      )}
    </div>
  )
}

function EmployeeRow({
  employee,
  selected,
  onToggle,
  COLORS,
  showPartTime = false,
}: {
  employee: Employee
  selected: boolean
  onToggle: () => void
  COLORS: ReturnType<typeof useColors>
  showPartTime?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: selected ? COLORS.primary : COLORS.border,
      }}
    >
      <div className="flex items-center p-4">
        <button
          onClick={onToggle}
          className="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mr-3"
          style={{
            borderColor: selected ? COLORS.primary : COLORS.border,
            backgroundColor: selected ? COLORS.primary + '15' : 'transparent',
          }}
        >
          {selected && <CheckCircle className="w-4 h-4" style={{ color: COLORS.primary }} />}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: COLORS.primary + '15',
                color: COLORS.primary,
              }}
            >
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                {employee.name}
              </p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                {employee.contract_type === 'laboral' ? 'Laboral' : 'Prestación de servicios'}
                {' · '}
                {employee.payment_type === 'porcentaje'
                  ? `${employee.percentage || 60}% comisión`
                  : employee.payment_type === 'mixed'
                    ? 'Mixto'
                    : 'Sueldo fijo'}
                {showPartTime && employee.part_time_percentage && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>
                    {employee.part_time_percentage}% tiempo
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: COLORS.textMuted }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && employee.payment_type !== 'porcentaje' && (
        <div
          className="px-4 pb-4 pt-0 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            Salario base: <span className="font-medium">{formatCurrencyCOP(employee.base_salary || 0)}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function BulkEditModal({
  COLORS,
  selectedCount,
  field,
  value,
  onFieldChange,
  onValueChange,
  onCancel,
  onApply,
}: {
  COLORS: ReturnType<typeof useColors>
  selectedCount: number
  field: BulkEditField
  value: string
  onFieldChange: (f: BulkEditField) => void
  onValueChange: (v: string) => void
  onCancel: () => void
  onApply: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="p-5 border-b" style={{ borderColor: COLORS.border }}>
          <h3
            className="text-lg font-bold"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Cambiar tipo
          </h3>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {selectedCount} empleado{selectedCount !== 1 ? 's' : ''} seleccionad{selectedCount !== 1 ? 'os' : 'o'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
              ¿Qué quieres cambiar?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onFieldChange('contract_type')}
                className="p-3 rounded-xl border-2 text-sm font-medium transition-all"
                style={{
                  borderColor: field === 'contract_type' ? COLORS.primary : COLORS.border,
                  backgroundColor: field === 'contract_type' ? COLORS.primary + '08' : 'transparent',
                  color: field === 'contract_type' ? COLORS.primary : COLORS.textSecondary,
                }}
              >
                <Briefcase className="w-4 h-4 mx-auto mb-1" />
                Contrato
              </button>
              <button
                onClick={() => onFieldChange('payment_type')}
                className="p-3 rounded-xl border-2 text-sm font-medium transition-all"
                style={{
                  borderColor: field === 'payment_type' ? COLORS.primary : COLORS.border,
                  backgroundColor: field === 'payment_type' ? COLORS.primary + '08' : 'transparent',
                  color: field === 'payment_type' ? COLORS.primary : COLORS.textSecondary,
                }}
              >
                <Percent className="w-4 h-4 mx-auto mb-1" />
                Pago
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
              Nuevo valor
            </label>
            {field === 'contract_type' ? (
              <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="laboral">Contrato Laboral</option>
                <option value="prestacion">Prestación de servicios</option>
              </select>
            ) : (
              <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="fijo">Sueldo Fijo</option>
                <option value="porcentaje">Comisión (porcentage)</option>
                <option value="mixed">Mixto</option>
              </select>
            )}
          </div>
        </div>

        <div className="p-5 border-t flex gap-3" style={{ borderColor: COLORS.border }}>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: COLORS.surfaceSubtle,
              color: COLORS.textSecondary,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onApply}
            disabled={!value}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}