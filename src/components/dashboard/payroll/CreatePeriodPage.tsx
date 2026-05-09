'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { EmployeeCardData } from './EmployeeCard'
import type { BulkEditField } from './BulkEditModal'
import PeriodStepSelect from './steps/PeriodStepSelect'
import EmployeeSelectionStep from './steps/EmployeeSelectionStep'

function useColors() {
  return useThemeColors()
}

const MONTHS = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

interface CreatePeriodPageProps {
  organizationId: string
  employees: EmployeeCardData[]
  existingPeriods: string[]
  previousPeriod?: { period: string; total_employees: number } | null
}

export function CreatePeriodPage({
  organizationId, employees, existingPeriods, previousPeriod,
}: CreatePeriodPageProps) {
  const COLORS = useColors()
  const router = useRouter()
  const now = new Date()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmployeeSelection, setShowEmployeeSelection] = useState(false)
  const [editableEmployees, setEditableEmployees] = useState<EmployeeCardData[]>(employees)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'))
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set(editableEmployees.map(e => e.id)))
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkEditField, setBulkEditField] = useState<BulkEditField>('contract_type')
  const [bulkEditValue, setBulkEditValue] = useState('')

  useEffect(() => { setMounted(true) }, [])

  const period = `${selectedYear}-${selectedMonth}`
  const periodExists = existingPeriods.includes(period)
  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''
  const periodLabel = `${monthLabel} ${selectedYear}`

  const previousPeriodLabel = useMemo(() => {
    if (!previousPeriod) return null
    const [y, m] = previousPeriod.period.split('-')
    const mn = MONTHS.find(mo => mo.value === m)?.label || ''
    return `${mn} ${y}`
  }, [previousPeriod])

  const groupedEmployees = useMemo(() => {
    const groups: Record<string, EmployeeCardData[]> = {
      laboral_full: [], laboral_part: [], prestacion: [],
    }
    editableEmployees.forEach(emp => {
      if (emp.contract_type === 'laboral') {
        groups[emp.employment_type === 'part_time' ? 'laboral_part' : 'laboral_full'].push(emp)
      } else {
        groups.prestacion.push(emp)
      }
    })
    return groups
  }, [editableEmployees]) // ← FIXED: was [employees], now recomputes after bulk edit

  const selectedCount = selectedEmployees.size
  const totalCount = editableEmployees.length

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
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleCopyPrevious = () => setShowEmployeeSelection(true)
  const handleStartEmpty = () => setShowEmployeeSelection(true)

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
      if (bulkEditField === 'contract_type') return { ...emp, contract_type: bulkEditValue }
      if (bulkEditField === 'payment_type') return { ...emp, payment_type: bulkEditValue }
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
    } catch {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!showEmployeeSelection) {
    return (
      <PeriodStepSelect
        COLORS={COLORS}
        mounted={mounted}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        periodExists={periodExists}
        periodLabel={periodLabel}
        employeesCount={employees.length}
        previousPeriod={previousPeriod}
        previousPeriodLabel={previousPeriodLabel}
        onCopyPrevious={handleCopyPrevious}
        onStartEmpty={handleStartEmpty}
      />
    )
  }

  return (
    <EmployeeSelectionStep
      COLORS={COLORS}
      mounted={mounted}
      periodLabel={periodLabel}
      groupedEmployees={groupedEmployees}
      selectedEmployees={selectedEmployees}
      selectedCount={selectedCount}
      totalCount={totalCount}
      onToggleEmployee={toggleEmployee}
      onSelectAll={handleSelectAll}
      onBulkEdit={handleBulkEdit}
      showBulkEdit={showBulkEdit}
      bulkEditField={bulkEditField}
      bulkEditValue={bulkEditValue}
      onBulkEditFieldChange={setBulkEditField}
      onBulkEditValueChange={setBulkEditValue}
      onApplyBulkEdit={applyBulkEdit}
      onCancelBulkEdit={() => setShowBulkEdit(false)}
      notes={notes}
      showNotes={showNotes}
      onNotesChange={setNotes}
      onToggleNotes={() => setShowNotes(!showNotes)}
      onBack={() => setShowEmployeeSelection(false)}
      onCreate={handleCreate}
      loading={loading}
      error={error}
    />
  )
}
