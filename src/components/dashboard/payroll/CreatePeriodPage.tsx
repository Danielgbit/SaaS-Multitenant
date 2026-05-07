'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
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
  Percent,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  FilePen,
  Check
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
  const [showNotes, setShowNotes] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(editableEmployees.map(e => e.id))
  )
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkEditField, setBulkEditField] = useState<BulkEditField>('contract_type')
  const [bulkEditValue, setBulkEditValue] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

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

    setEditableEmployees(prev => prev.map(emp => {
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
      <div className={`min-h-screen p-6 md:p-8 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header con breadcrumb */}
          <div className="flex items-center gap-4">
            <Link
              href="/payroll"
              className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ color: COLORS.textSecondary }}
              aria-label="Volver a nómina"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
                  Nómina
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                  Paso 1 de 2
                </span>
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
              >
                Crear Período
              </h1>
            </div>
          </div>

          {/* Banner de período mejorado */}
          <div
            className="rounded-2xl border overflow-hidden relative"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%)`,
              borderColor: COLORS.primary + '40'
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4">
                <Calendar className="w-24 h-24 text-white" />
              </div>
            </div>
            <div className="p-6 md:p-8 text-center relative z-10">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h2
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {periodLabel}
              </h2>
              <p className="text-white/70 text-sm">
                ¿Cómo quieres crear este período?
              </p>
              {periodExists && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-medium">Período ya existe</span>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de selección de período */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200"
            style={{ 
              backgroundColor: COLORS.surfaceGlass || COLORS.surface, 
              borderColor: COLORS.border,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
              <h3
                className="text-lg font-semibold"
                style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
              >
                Seleccionar Período
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                  <Calendar className="w-4 h-4" />
                  Mes
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2"
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: COLORS.textMuted }} />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                  <Clock className="w-4 h-4" />
                  Año
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  >
                    <option value={now.getFullYear()}>{now.getFullYear()}</option>
                    <option value={now.getFullYear() + 1}>{now.getFullYear() + 1}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: COLORS.textMuted }} />
                </div>
              </div>
            </div>

            {/* Preview del período seleccionado */}
            <div className="mt-4 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <Sparkles className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                    Período seleccionado
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    {employees.length} empleados activos disponibles
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold" style={{ color: COLORS.primary, fontFamily: 'Cormorant Garamond, serif' }}>
                {periodLabel}
              </p>
            </div>

            {periodExists && (
              <div
                className="mt-4 p-4 rounded-xl flex items-center gap-3 animate-pulse"
                style={{ backgroundColor: COLORS.error + '15' }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.error }} />
                <p className="text-sm" style={{ color: COLORS.error }}>
                  Ya existe un período para {periodLabel}
                </p>
              </div>
            )}
          </div>

          {/* Opciones de creación mejoradas */}
          <div className="space-y-3">
            {previousPeriod && (
              <button
                onClick={handleCopyPrevious}
                disabled={periodExists}
                className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer hover:shadow-md"
                style={{
                  borderColor: periodExists ? COLORS.border : COLORS.primary + '40',
                  backgroundColor: COLORS.surface,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <Copy className="w-6 h-6" style={{ color: COLORS.primary }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
                        Copiar de {previousPeriodLabel}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                        Recomendado
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>
                      Usa los {previousPeriod.total_employees} empleados del período anterior
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: COLORS.textMuted }} />
                </div>
              </button>
            )}

            <button
              onClick={handleStartEmpty}
              disabled={periodExists}
              className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer hover:shadow-md"
              style={{
                borderColor: periodExists ? COLORS.border : COLORS.border,
                backgroundColor: COLORS.surface,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                  style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08' }}
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
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: COLORS.textMuted }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 md:p-8 pb-32 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header con breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowEmployeeSelection(false)}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            style={{ color: COLORS.textSecondary }}
            aria-label="Volver a selección de período"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
                Nómina
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                Paso 2 de 2
              </span>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Seleccionar Empleados
            </h1>
          </div>
        </div>

        {/* Banner de período */}
        <div
          className="rounded-2xl border overflow-hidden relative"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%)`,
            borderColor: COLORS.primary + '40'
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4">
              <Users className="w-24 h-24 text-white" />
            </div>
          </div>
          <div className="p-6 md:p-8 text-center relative z-10">
            <h2
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {periodLabel}
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {selectedCount} de {totalCount} seleccionados
                </span>
              </div>
            </div>
            {/* Barra de progreso visual */}
            <div className="mt-4 mx-auto max-w-xs h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div 
                className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${totalCount > 0 ? (selectedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Barra de acciones */}
        <div
          className="p-4 rounded-xl border flex items-center justify-between transition-all duration-200"
          style={{ 
            backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', 
            borderColor: COLORS.border 
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105"
              style={{
                borderColor: selectedCount === totalCount ? COLORS.primary : COLORS.border,
                backgroundColor: selectedCount === totalCount ? COLORS.primary : 'transparent',
              }}
              aria-label={selectedCount === totalCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
            >
              {selectedCount === totalCount && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
              {selectedCount === totalCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </span>
          </div>
          <button
            onClick={handleBulkEdit}
            disabled={selectedCount === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer hover:shadow-sm"
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

        {/* Lista de empleados agrupados */}
        <div className="space-y-6">
          {/* Grupo: Contrato Laboral Tiempo Completo */}
          {groupedEmployees.laboral_full.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                    Contrato Laboral · Tiempo Completo
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                  {groupedEmployees.laboral_full.length}
                </span>
              </div>
              <div className="space-y-2">
                {groupedEmployees.laboral_full.map((emp, index) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => toggleEmployee(emp.id)}
                    COLORS={COLORS}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grupo: Contrato Laboral Medio Tiempo */}
          {groupedEmployees.laboral_part.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '15' }}>
                  <Clock className="w-4 h-4" style={{ color: COLORS.warning }} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                    Contrato Laboral · Medio Tiempo
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                  {groupedEmployees.laboral_part.length}
                </span>
              </div>
              <div className="space-y-2">
                {groupedEmployees.laboral_part.map((emp, index) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => toggleEmployee(emp.id)}
                    COLORS={COLORS}
                    showPartTime
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grupo: Prestación de Servicios */}
          {groupedEmployees.prestacion.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.info + '15' }}>
                  <FileText className="w-4 h-4" style={{ color: COLORS.info }} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                    Prestación de Servicios
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: COLORS.info + '15', color: COLORS.info }}>
                  {groupedEmployees.prestacion.length}
                </span>
              </div>
              <div className="space-y-2">
                {groupedEmployees.prestacion.map((emp, index) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => toggleEmployee(emp.id)}
                    COLORS={COLORS}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sección de notas colapsable */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border }}>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="w-full p-4 flex items-center justify-between transition-colors duration-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
            style={{ backgroundColor: showNotes ? COLORS.surfaceSubtle || COLORS.primary + '08' : 'transparent' }}
          >
            <div className="flex items-center gap-3">
              <FilePen className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
              <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                Notas del período
              </span>
              {notes && (
                <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                  {notes.length} caracteres
                </span>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 transition-transform duration-200 ${showNotes ? 'rotate-180' : ''}`} 
              style={{ color: COLORS.textMuted }} 
            />
          </button>
          {showNotes && (
            <div className="px-4 pb-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre este período (opcional)..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border resize-none transition-all duration-200 focus:outline-none focus:ring-2 text-sm"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              />
              <div className="flex justify-end mt-2">
                <span className="text-xs" style={{ color: COLORS.textMuted }}>
                  {notes.length}/500
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: COLORS.error + '15' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.error }} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowEmployeeSelection(false)}
            className="flex-1 px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
            style={{
              backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08',
              color: COLORS.textSecondary,
            }}
          >
            Volver
          </button>
          <button
            onClick={handleCreate}
            disabled={periodExists || selectedCount === 0 || loading}
            className="flex-1 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Crear Período
                <span className="opacity-70">({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de acciones flotante sticky */}
      {selectedCount > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 md:left-64 z-40"
          style={{ 
            backgroundColor: COLORS.surface + 'f5',
            backdropFilter: 'blur(12px)',
            borderTop: `1px solid ${COLORS.border}`
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                <CheckCircle className="w-4 h-4" style={{ color: COLORS.primary }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                  {selectedCount} empleado{selectedCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  seleccionad{selectedCount !== 1 ? 'os' : 'o'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={periodExists || loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 cursor-pointer hover:shadow-md flex items-center gap-2"
              style={{ backgroundColor: COLORS.primary }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Crear período
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
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
  index = 0,
}: {
  employee: Employee
  selected: boolean
  onToggle: () => void
  COLORS: ReturnType<typeof useColors>
  showPartTime?: boolean
  index?: number
}) {
  const [expanded, setExpanded] = useState(false)

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getPaymentBadge = () => {
    if (employee.payment_type === 'porcentaje') {
      return {
        label: `${employee.percentage || 60}% comisión`,
        color: COLORS.success,
        bg: COLORS.success + '15'
      }
    }
    if (employee.payment_type === 'mixed') {
      return {
        label: 'Mixto',
        color: COLORS.warning,
        bg: COLORS.warning + '15'
      }
    }
    return {
      label: 'Sueldo fijo',
      color: COLORS.info,
      bg: COLORS.info + '15'
    }
  }

  const badge = getPaymentBadge()

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer group"
      style={{
        backgroundColor: selected ? COLORS.primary + '08' : COLORS.surface,
        borderColor: selected ? COLORS.primary : COLORS.border,
        boxShadow: selected ? `0 0 0 1px ${COLORS.primary}` : 'none',
        animationDelay: `${index * 50}ms`
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      aria-label={`Seleccionar empleado ${employee.name}`}
      aria-pressed={selected}
    >
      <div className="flex items-center p-4">
        {/* Checkbox */}
        <div
          className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 mr-3 flex-shrink-0"
          style={{
            borderColor: selected ? COLORS.primary : COLORS.border,
            backgroundColor: selected ? COLORS.primary : 'transparent',
            transform: selected ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 transition-all duration-200 group-hover:scale-105"
          style={{
            backgroundColor: selected ? COLORS.primary + '20' : COLORS.primary + '10',
            color: COLORS.primary,
          }}
        >
          {getInitials(employee.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: COLORS.textPrimary }}>
            {employee.name}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', color: COLORS.textMuted }}>
              {employee.contract_type === 'laboral' ? 'Laboral' : 'Prestación'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
            {showPartTime && employee.part_time_percentage && (
              <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                <Clock className="w-3 h-3" />
                {employee.part_time_percentage}%
              </span>
            )}
          </div>
        </div>

        {/* Expand button */}
        {employee.payment_type !== 'porcentaje' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textMuted }}
            aria-label={expanded ? 'Colapsar detalles' : 'Expandir detalles'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && employee.payment_type !== 'porcentaje' && (
        <div
          className="px-4 pb-4 pt-0 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '10' }}>
              <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Salario base
              </p>
              <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                {formatCurrencyCOP(employee.base_salary || 0)}
              </p>
            </div>
          </div>
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
        style={{ backgroundColor: COLORS.surface }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-title"
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Pencil className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
            <div>
              <h3
                id="bulk-edit-title"
                className="text-lg font-bold"
                style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
              >
                Cambiar tipo
              </h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {selectedCount} empleado{selectedCount !== 1 ? 's' : ''} seleccionad{selectedCount !== 1 ? 'os' : 'o'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textMuted }}
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Field selection */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: COLORS.textSecondary }}>
              ¿Qué quieres cambiar?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onFieldChange('contract_type')}
                className="p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
                style={{
                  borderColor: field === 'contract_type' ? COLORS.primary : COLORS.border,
                  backgroundColor: field === 'contract_type' ? COLORS.primary + '08' : 'transparent',
                  color: field === 'contract_type' ? COLORS.primary : COLORS.textSecondary,
                }}
              >
                <Briefcase className="w-5 h-5 mx-auto mb-2" />
                <span className="block">Contrato</span>
              </button>
              <button
                onClick={() => onFieldChange('payment_type')}
                className="p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
                style={{
                  borderColor: field === 'payment_type' ? COLORS.primary : COLORS.border,
                  backgroundColor: field === 'payment_type' ? COLORS.primary + '08' : 'transparent',
                  color: field === 'payment_type' ? COLORS.primary : COLORS.textSecondary,
                }}
              >
                <Percent className="w-5 h-5 mx-auto mb-2" />
                <span className="block">Pago</span>
              </button>
            </div>
          </div>

          {/* Value selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
              Nuevo valor
            </label>
            <div className="relative">
              {field === 'contract_type' ? (
                <select
                  value={value}
                  onChange={(e) => onValueChange(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2"
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
                  className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                  }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="fijo">Sueldo Fijo</option>
                  <option value="porcentaje">Comisión (porcentaje)</option>
                  <option value="mixed">Mixto</option>
                </select>
              )}
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: COLORS.textMuted }} />
            </div>
          </div>

          {/* Preview */}
          {value && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: COLORS.success + '10' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
              <p className="text-sm" style={{ color: COLORS.success }}>
                Se aplicará a {selectedCount} empleado{selectedCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-3" style={{ borderColor: COLORS.border }}>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
            style={{
              backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08',
              color: COLORS.textSecondary,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onApply}
            disabled={!value}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Check className="w-4 h-4" />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
