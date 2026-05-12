'use client'

import { useState } from 'react'
import { Coffee, Plus, X, Check, Save, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { setAvailability } from '@/actions/availability/setAvailability'
import { createOverride, deleteOverride } from '@/actions/availability/overrideActions'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeWithSchedules } from '@/types/availability'

interface BreaksSectionProps {
  organizationId: string
  employees: EmployeeWithSchedules[]
}

function BreaksSection({ organizationId, employees }: BreaksSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    days: [] as number[],
    breakStart: '13:00',
    breakEnd: '14:00',
    reason: 'Hora de almuerzo',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  // Per-day editing states
  const [savingDay, setSavingDay] = useState<string | null>(null)
  const [savedDay, setSavedDay] = useState<string | null>(null)
  const [isCreatingOverride, setIsCreatingOverride] = useState<string | null>(null)
  const [isDeletingOverride, setIsDeletingOverride] = useState<string | null>(null)
  const [overrideForms, setOverrideForms] = useState<Record<string, { date: string; start_time: string; end_time: string; reason: string }>>({})
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({})

  // ── Edición masiva (reusa el panel de creación) ──
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null)

  // ── Override rápido desde tarjeta colapsada ──
  const [quickOverrideEmpId, setQuickOverrideEmpId] = useState<string | null>(null)
  const [quickOverrideForm, setQuickOverrideForm] = useState({ date: '', start_time: '', end_time: '', reason: '' })
  const [isSavingQuickOverride, setIsSavingQuickOverride] = useState(false)
  const [quickOverrideError, setQuickOverrideError] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // ── Creación / Edición masiva ──

  function resetCreateForm() {
    setCreateForm({ employeeId: '', days: [], breakStart: '13:00', breakEnd: '14:00', reason: 'Hora de almuerzo' })
    setCreateError(null)
    setCreateSuccess(false)
  }

  function openCreateForm() {
    setEditEmployeeId(null)
    resetCreateForm()
    setShowCreateForm(true)
  }

  function openEditForm(employee: EmployeeWithSchedules) {
    const breakDays = employee.availability.filter((a) => a.break_start && a.break_end)
    if (breakDays.length === 0) return
    const first = breakDays[0]
    setCreateForm({
      employeeId: employee.id,
      days: breakDays.map((a) => a.day_of_week),
      breakStart: first.break_start || '13:00',
      breakEnd: first.break_end || '14:00',
      reason: first.break_reason || 'Hora de almuerzo',
    })
    setEditEmployeeId(employee.id)
    setShowCreateForm(true)
  }

  function closeCreateForm() {
    setShowCreateForm(false)
    setEditEmployeeId(null)
    resetCreateForm()
  }

  function toggleDay(day: number) {
    setCreateForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }))
  }

  function toggleAllDays() {
    const avail = getSelectedEmployeeAvailability()
    const allDays = avail.map((a) => a.day_of_week)
    const allSelected = allDays.every((d) => createForm.days.includes(d))
    setCreateForm((prev) => ({
      ...prev,
      days: allSelected ? [] : allDays,
    }))
  }

  function getSelectedEmployeeAvailability() {
    if (!createForm.employeeId) return []
    const emp = employees.find((e) => e.id === createForm.employeeId)
    return emp?.availability || []
  }

  async function handleCreateBreaks(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.employeeId || createForm.days.length === 0) {
      setCreateError('Selecciona un empleado y al menos un día.')
      return
    }
    if (!createForm.breakStart || !createForm.breakEnd) {
      setCreateError('Completa la hora de inicio y fin del descanso.')
      return
    }
    if (createForm.breakStart >= createForm.breakEnd) {
      setCreateError('El inicio del descanso debe ser antes del fin.')
      return
    }

    setIsCreating(true)
    setCreateError(null)
    setCreateSuccess(false)

    const emp = employees.find((e) => e.id === createForm.employeeId)
    if (!emp) { setIsCreating(false); return }

    let hasError = false
    for (const day of createForm.days) {
      const avail = emp.availability.find((a) => a.day_of_week === day)
      if (!avail) continue

      const result = await setAvailability({
        employee_id: createForm.employeeId,
        day_of_week: day,
        start_time: avail.start_time,
        end_time: avail.end_time,
        break_start: createForm.breakStart,
        break_end: createForm.breakEnd,
        break_reason: createForm.reason || 'Hora de almuerzo',
      })
      if (!result.success) {
        hasError = true
      }
    }

    setIsCreating(false)
    if (hasError) {
      setCreateError('Algunos días no se pudieron guardar.')
    } else {
      setCreateSuccess(true)
      setTimeout(() => {
        closeCreateForm()
      }, 1500)
    }
  }

  // ── Edición por día ──

  async function handleSaveBreak(employeeId: string, dayOfWeek: number, formData: FormData) {
    setSavingDay(`${employeeId}-${dayOfWeek}`)
    setSavedDay(null)

    const breakStart = formData.get('break_start') as string
    const breakEnd = formData.get('break_end') as string
    const breakReason = formData.get('break_reason') as string
    const hasBreak = formData.get('has_break') === 'true'

    const result = await setAvailability({
      employee_id: employeeId,
      day_of_week: dayOfWeek,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      break_start: hasBreak ? breakStart : null,
      break_end: hasBreak ? breakEnd : null,
      break_reason: hasBreak ? (breakReason || 'Hora de almuerzo') : null,
    })

    setSavingDay(null)
    if (result.success) {
      setSavedDay(`${employeeId}-${dayOfWeek}`)
      setTimeout(() => setSavedDay(null), 2000)
    }
  }

  async function handleCreateOverride(employeeId: string, e: React.FormEvent) {
    e.preventDefault()
    setIsCreatingOverride(employeeId)

    const form = overrideForms[employeeId] || { date: '', start_time: '', end_time: '', reason: '' }

    const result = await createOverride({
      employee_id: employeeId,
      date: form.date,
      start_time: null,
      end_time: null,
      is_day_off: false,
      reason: form.reason || 'Descanso',
      break_start: form.start_time || undefined,
      break_end: form.end_time || undefined,
    })

    setIsCreatingOverride(null)
    if (result.success) {
      setOverrideForms((prev) => ({ ...prev, [employeeId]: { date: '', start_time: '', end_time: '', reason: '' } }))
    }
  }

  async function handleDeleteOverride(overrideId: string) {
    setIsDeletingOverride(overrideId)
    await deleteOverride(overrideId)
    setIsDeletingOverride(null)
  }

  function getBreaksOverrides(employee: EmployeeWithSchedules) {
    return employee.overrides.filter((o) => o.break_start && o.break_end)
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-600/50 bg-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] placeholder:text-slate-500 transition-all duration-200"

  return (
    <section className="mb-8 p-5 sm:p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center shadow-lg flex-shrink-0">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
              Descansos
            </h2>
            <p className="text-sm text-slate-400">
              Configura los horarios de descanso de tu equipo (almuerzo, pausas)
            </p>
          </div>
        </div>
        {!showCreateForm && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38BDF8] text-white font-medium text-sm hover:bg-[#38BDF8]/90 hover:shadow-lg hover:shadow-[#38BDF8]/20 transition-all duration-200 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Crear descanso
          </button>
        )}
      </div>

      {/* ── Formulario de creación ── */}
      {showCreateForm && (
        <div className="mb-6 p-5 bg-slate-700/50 rounded-xl border border-slate-600/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">
              {editEmployeeId ? 'Editar descanso' : 'Nuevo descanso'}
            </h3>
            <button
              onClick={closeCreateForm}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateBreaks} className="space-y-4">
            {/* Employee */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Empleado</label>
              <select
                required
                disabled={!!editEmployeeId}
                value={createForm.employeeId}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, employeeId: e.target.value, days: [] }))
                  setCreateError(null)
                }}
                className={`${inputClass} ${editEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Seleccionar empleado...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Days */}
            {createForm.employeeId && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-300">Días</label>
                  {getSelectedEmployeeAvailability().length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllDays}
                      className="text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors cursor-pointer"
                    >
                      {getSelectedEmployeeAvailability().every((a) => createForm.days.includes(a.day_of_week))
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                  )}
                </div>
                {getSelectedEmployeeAvailability().length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Este empleado no tiene horarios configurados. Ve a la sección &quot;Horarios de Empleados&quot; para configurar su disponibilidad primero.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getSelectedEmployeeAvailability().map((av) => {
                      const day = WEEKDAYS.find((w) => w.value === av.day_of_week)
                      const selected = createForm.days.includes(av.day_of_week)
                      return (
                        <button
                          key={av.day_of_week}
                          type="button"
                          onClick={() => toggleDay(av.day_of_week)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                            selected
                              ? 'bg-[#38BDF8] text-white shadow-sm'
                              : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {day?.short || av.day_of_week}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Time + Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Inicio</label>
                <input
                  type="time"
                  required
                  value={createForm.breakStart}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, breakStart: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Fin</label>
                <input
                  type="time"
                  required
                  value={createForm.breakEnd}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, breakEnd: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Motivo</label>
                <input
                  type="text"
                  value={createForm.reason}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ej: Hora de almuerzo"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Feedback */}
            {createError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                {createError}
              </p>
            )}
            {createSuccess && (
              <p className="text-sm text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Descanso guardado correctamente
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isCreating || createForm.days.length === 0 || !createForm.employeeId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38BDF8] text-white font-medium text-sm hover:bg-[#38BDF8]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isCreating ? 'Guardando...' : `Guardar (${createForm.days.length} día${createForm.days.length !== 1 ? 's' : ''})`}
              </button>
              <button
                type="button"
                onClick={closeCreateForm}
                className="px-5 py-2.5 rounded-xl border border-slate-600/50 text-slate-300 font-medium text-sm hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lista de empleados ── */}
      {employees.length === 0 ? (
        <div className="text-center py-10">
          <Coffee className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No hay empleados registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => {
            const isExpanded = expandedEmployees[employee.id] ?? false
            const breakDays = employee.availability.filter((a) => a.break_start && a.break_end)
            const hasBreaks = breakDays.length > 0
            const breakOverridesCount = getBreaksOverrides(employee).length

            // Resumen colapsado
            let summary: string
            if (employee.availability.length === 0) {
              summary = 'Sin horarios regulares'
            } else if (!hasBreaks) {
              summary = 'Sin descansos configurados'
            } else {
              const dayLabels = breakDays
                .map((a) => WEEKDAYS.find((w) => w.value === a.day_of_week)?.short)
                .filter(Boolean)
                .join(', ')
              const firstBreak = breakDays[0]
              summary = `${firstBreak.break_reason || 'Descanso'}: ${dayLabels} ${firstBreak.break_start?.slice(0, 5)}-${firstBreak.break_end?.slice(0, 5)}`
            }

            return (
              <div
                key={employee.id}
                className="border border-slate-600/30 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* ── Header (siempre visible) ── */}
                <button
                  onClick={() =>
                    setExpandedEmployees((prev) => ({
                      ...prev,
                      [employee.id]: !prev[employee.id],
                    }))
                  }
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-slate-700/80 hover:bg-slate-700 transition-all duration-200 cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white font-semibold text-sm">
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base">
                        {employee.name}
                      </p>
                      {!isExpanded && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {summary}
                          {hasBreaks && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditForm(employee) }}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8]/25 ml-2 transition-all duration-200 cursor-pointer"
                            >
                              Editar
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {breakOverridesCount > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#38BDF8]/15 text-[#38BDF8]">
                        +{breakOverridesCount}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setQuickOverrideEmpId(quickOverrideEmpId === employee.id ? null : employee.id)
                        setQuickOverrideForm({ date: '', start_time: '', end_time: '', reason: '' })
                        setQuickOverrideError(null)
                        setShowDatePicker(false)
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-600/50 hover:bg-[#38BDF8]/20 transition-all duration-200 cursor-pointer"
                      aria-label="Agregar excepción de descanso"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isExpanded
                          ? 'bg-[#38BDF8]/20'
                          : 'bg-slate-600/50'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#38BDF8]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* ── Override rápido ── */}
                {quickOverrideEmpId === employee.id && (
                  <div
                    className="border-t overflow-hidden transition-all duration-300"
                    style={{
                      borderColor: 'rgba(251, 191, 36, 0.2)',
                      background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.04) 0%, rgba(251, 191, 36, 0.01) 100%)',
                    }}
                  >
                    <div className="px-4 sm:px-5 py-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)' }}
                          >
                            <Calendar className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-amber-300 leading-tight">
                              Excepción por fecha
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                              Este cambio aplica solo para un día específico
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuickOverrideEmpId(null)}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-700/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 cursor-pointer flex-shrink-0"
                          aria-label="Cerrar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (!quickOverrideForm.date || !quickOverrideForm.start_time || !quickOverrideForm.end_time) {
                            setQuickOverrideError('Completa todos los campos.')
                            return
                          }
                          if (quickOverrideForm.start_time >= quickOverrideForm.end_time) {
                            setQuickOverrideError('El inicio debe ser antes del fin.')
                            return
                          }
                          setIsSavingQuickOverride(true)
                          setQuickOverrideError(null)
                          createOverride({
                            employee_id: employee.id,
                            date: quickOverrideForm.date,
                            start_time: null,
                            end_time: null,
                            is_day_off: false,
                            reason: quickOverrideForm.reason || 'Cambio de horario',
                            break_start: quickOverrideForm.start_time,
                            break_end: quickOverrideForm.end_time,
                          }).then((result) => {
                            setIsSavingQuickOverride(false)
                            if (result.success) {
                              setQuickOverrideEmpId(null)
                            } else {
                              setQuickOverrideError(result.error || 'Error al guardar')
                            }
                          })
                        }}
                        className="space-y-3"
                      >
                        {/* Card 1: Day selector */}
                        <div
                          className="p-3 sm:p-4 rounded-xl border transition-all duration-200"
                          style={{
                            backgroundColor: 'rgba(251, 191, 36, 0.05)',
                            borderColor: 'rgba(251, 191, 36, 0.1)',
                          }}
                        >
                          <label className="block text-xs font-semibold text-slate-300 mb-2.5">
                            ¿Qué día?
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(quickOverrideEmpId ? WEEKDAYS : []).map((wd) => {
                              const nextDate = (() => {
                                const today = new Date()
                                const currentDay = today.getDay()
                                let diff = wd.value - currentDay
                                if (diff <= 0) diff += 7
                                const next = new Date(today)
                                next.setDate(today.getDate() + diff)
                                return next.toISOString().split('T')[0]
                              })()
                              const isSelected = quickOverrideForm.date === nextDate
                              return (
                                <button
                                  key={wd.value}
                                  type="button"
                                  onClick={() => {
                                    setQuickOverrideForm((p) => ({ ...p, date: nextDate }))
                                    setShowDatePicker(false)
                                    setQuickOverrideError(null)
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 -translate-y-0.5'
                                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600 hover:text-white active:scale-95'
                                  }`}
                                >
                                  {wd.short}
                                </button>
                              )
                            })}
                          </div>

                          {quickOverrideForm.date && !showDatePicker && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-500/10">
                              <span className="text-[11px] text-slate-400">
                                → {new Date(quickOverrideForm.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowDatePicker(true)}
                                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                              >
                                Otra fecha
                              </button>
                            </div>
                          )}

                          {showDatePicker && (
                            <div className="mt-2.5 pt-2.5 border-t border-amber-500/10">
                              <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={quickOverrideForm.date}
                                onChange={(e) => setQuickOverrideForm((p) => ({ ...p, date: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl border text-sm text-white focus:outline-none focus:ring-2 transition-all duration-200"
                                style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                  borderColor: 'rgba(251, 191, 36, 0.2)',
                                  accentColor: '#F59E0B',
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Card 2: Time + Action */}
                        <div
                          className="p-3 sm:p-4 rounded-xl border transition-all duration-200"
                          style={{
                            backgroundColor: 'rgba(251, 191, 36, 0.05)',
                            borderColor: 'rgba(251, 191, 36, 0.1)',
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Desde</label>
                                <input
                                  type="time"
                                  required
                                  value={quickOverrideForm.start_time}
                                  onChange={(e) => setQuickOverrideForm((p) => ({ ...p, start_time: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-xl border text-xs text-white focus:outline-none focus:ring-2 transition-all duration-200"
                                  style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderColor: 'rgba(251, 191, 36, 0.15)',
                                    accentColor: '#F59E0B',
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-center pt-5 px-1">
                                <span
                                  className="w-5 h-px block"
                                  style={{ backgroundColor: 'rgba(251, 191, 36, 0.3)' }}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Hasta</label>
                                <input
                                  type="time"
                                  required
                                  value={quickOverrideForm.end_time}
                                  onChange={(e) => setQuickOverrideForm((p) => ({ ...p, end_time: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-xl border text-xs text-white focus:outline-none focus:ring-2 transition-all duration-200"
                                  style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderColor: 'rgba(251, 191, 36, 0.15)',
                                    accentColor: '#F59E0B',
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 sm:flex-none sm:w-28">
                                <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Motivo</label>
                                <input
                                  type="text"
                                  placeholder="Cambio horario"
                                  value={quickOverrideForm.reason}
                                  onChange={(e) => setQuickOverrideForm((p) => ({ ...p, reason: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-xl border text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all duration-200"
                                  style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderColor: 'rgba(251, 191, 36, 0.15)',
                                    accentColor: '#F59E0B',
                                  }}
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={isSavingQuickOverride}
                                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold shadow-sm shadow-amber-500/20 hover:bg-amber-500/90 hover:shadow-md hover:shadow-amber-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 mt-5 sm:mt-0"
                              >
                                {isSavingQuickOverride ? (
                                  <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                {isSavingQuickOverride ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {quickOverrideError && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                            <X className="w-3 h-3 flex-shrink-0" />
                            {quickOverrideError}
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                )}

                {/* ── Body expandido ── */}
                {isExpanded && (
                  <div className="border-t border-slate-600/30 bg-slate-700/50">
                    <div className="p-4 sm:p-5">
                      {employee.availability.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Sin horarios regulares configurados.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {employee.availability.map((av) => {
                            const day = WEEKDAYS.find((w) => w.value === av.day_of_week)
                            const hasBreak = !!av.break_start && !!av.break_end
                            const dayKey = `${employee.id}-${av.day_of_week}`
                            const isSaving = savingDay === dayKey
                            const isSaved = savedDay === dayKey

                            return (
                              <form
                                key={av.id}
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  handleSaveBreak(employee.id, av.day_of_week, new FormData(e.currentTarget))
                                }}
                                className={`p-3 rounded-lg bg-slate-700/60 border transition-all duration-200 ${hasBreak ? 'border-l-2 border-[#38BDF8]/40 border-slate-600/40' : 'border-slate-600/30'}`}
                              >
                                <input type="hidden" name="start_time" value={av.start_time} />
                                <input type="hidden" name="end_time" value={av.end_time} />
                                <input type="hidden" name="has_break" value={hasBreak ? 'true' : ''} />

                                {/* LINE 1: Day label + toggle */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white w-12">{day?.short}</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-600/30 px-1.5 py-0.5 rounded whitespace-nowrap">Cada semana</span>
                                    <span className="text-xs text-slate-400 hidden sm:inline">{av.start_time.slice(0, 5)}-{av.end_time.slice(0, 5)}</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium transition-colors duration-200 ${hasBreak ? 'text-[#38BDF8]' : 'text-slate-500'}`}>
                                      {hasBreak ? 'Descanso activado' : 'Descanso'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        const form = (e.currentTarget as HTMLElement).closest('form')!
                                        const hidden = form.querySelector('[name="has_break"]') as HTMLInputElement
                                        const controls = form.querySelector('.break-controls') as HTMLElement
                                        const toggles = form.querySelectorAll('.break-toggle-input')
                                        const newVal = hidden.value !== 'true'
                                        hidden.value = newVal ? 'true' : ''
                                        if (controls) {
                                          controls.classList.toggle('hidden', !newVal)
                                          controls.classList.toggle('flex', newVal)
                                        }
                                        toggles.forEach((el) => {
                                          const input = el as HTMLInputElement
                                          if (!newVal) {
                                            input.value = ''
                                            input.disabled = true
                                          } else {
                                            input.disabled = false
                                          }
                                        })
                                      }}
                                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40"
                                      style={{ backgroundColor: hasBreak ? '#38BDF8' : '#475569' }}
                                      aria-label={hasBreak ? 'Desactivar descanso' : 'Activar descanso'}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                          hasBreak ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* LINE 2: Controls (visible only when toggle ON) */}
                                <div className={`break-controls mt-3 pt-3 border-t border-slate-600/30 ${hasBreak ? 'flex' : 'hidden'} flex-col sm:flex-row sm:items-center gap-2 sm:gap-3`}>
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="time"
                                      name="break_start"
                                      defaultValue={av.break_start || ''}
                                      disabled={!hasBreak}
                                      className={`${inputClass} break-toggle-input w-28 ${!hasBreak ? 'opacity-40' : ''}`}
                                    />
                                    <span className="text-slate-500 text-xs flex-shrink-0">→</span>
                                    <input
                                      type="time"
                                      name="break_end"
                                      defaultValue={av.break_end || ''}
                                      disabled={!hasBreak}
                                      className={`${inputClass} break-toggle-input w-28 ${!hasBreak ? 'opacity-40' : ''}`}
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      name="break_reason"
                                      defaultValue={av.break_reason || 'Hora de almuerzo'}
                                      disabled={!hasBreak}
                                      placeholder="Motivo"
                                      className={`${inputClass} break-toggle-input w-28 sm:w-32 ${!hasBreak ? 'opacity-40' : ''}`}
                                    />

                                    <button
                                      type="submit"
                                      disabled={isSaving}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shadow-sm transition-all duration-200 cursor-pointer flex-shrink-0 disabled:opacity-60 hover:shadow-md"
                                      style={{
                                        backgroundColor: isSaved ? '#10B981' : '#38BDF8',
                                        color: '#FFF',
                                      }}
                                    >
                                      {isSaving ? (
                                        <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                                      ) : isSaved ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      {isSaved ? 'Guardado' : 'Guardar'}
                                    </button>
                                  </div>
                                </div>
                              </form>
                            )
                          })}
                        </div>
                      )}

                      {/* Overrides */}
                      <div className="mt-5 pt-4 border-t border-slate-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Excepciones de descanso
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setOverrideForms((prev) => ({
                                ...prev,
                                [employee.id]: prev[employee.id] || { date: '', start_time: '', end_time: '', reason: '' },
                              }))
                            }
                            className="flex items-center gap-1 text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </button>
                        </div>

                        {overrideForms[employee.id] && (
                          <form
                            onSubmit={(e) => handleCreateOverride(employee.id, e)}
                            className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-700/30 border border-slate-600/20 mb-2"
                          >
                            <input
                              type="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              value={overrideForms[employee.id]?.date || ''}
                              onChange={(e) =>
                                setOverrideForms((prev) => ({
                                  ...prev,
                                  [employee.id]: { ...prev[employee.id], date: e.target.value },
                                }))
                              }
                              className={`${inputClass} w-36`}
                            />
                            <input
                              type="time"
                              required
                              value={overrideForms[employee.id]?.start_time || ''}
                              onChange={(e) =>
                                setOverrideForms((prev) => ({
                                  ...prev,
                                  [employee.id]: { ...prev[employee.id], start_time: e.target.value },
                                }))
                              }
                              className={`${inputClass} w-24`}
                            />
                            <span className="text-slate-500 text-xs">→</span>
                            <input
                              type="time"
                              required
                              value={overrideForms[employee.id]?.end_time || ''}
                              onChange={(e) =>
                                setOverrideForms((prev) => ({
                                  ...prev,
                                  [employee.id]: { ...prev[employee.id], end_time: e.target.value },
                                }))
                              }
                              className={`${inputClass} w-24`}
                            />
                            <input
                              type="text"
                              placeholder="Motivo"
                              value={overrideForms[employee.id]?.reason || ''}
                              onChange={(e) =>
                                setOverrideForms((prev) => ({
                                  ...prev,
                                  [employee.id]: { ...prev[employee.id], reason: e.target.value },
                                }))
                              }
                              className={`${inputClass} w-28`}
                            />
                            <button
                              type="submit"
                              disabled={isCreatingOverride === employee.id}
                              className="px-3 py-2 rounded-lg bg-[#38BDF8] text-white text-xs font-medium hover:bg-[#38BDF8]/90 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                            >
                              {isCreatingOverride === employee.id ? '...' : 'Crear'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setOverrideForms((prev) => {
                                  const copy = { ...prev }
                                  delete copy[employee.id]
                                  return copy
                                })
                              }
                              className="p-2 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        )}

                        {breakOverridesCount > 0 && (
                          <div className="space-y-1">
                            {getBreaksOverrides(employee).map((o) => (
                              <div
                                key={o.id}
                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                  <span className="text-xs text-slate-300">
                                    {new Date(o.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {o.break_start?.slice(0, 5)} - {o.break_end?.slice(0, 5)}
                                  </span>
                                  {o.reason && <span className="text-xs text-slate-500">· {o.reason}</span>}
                                </div>
                                <button
                                  onClick={() => handleDeleteOverride(o.id)}
                                  disabled={isDeletingOverride === o.id}
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isDeletingOverride === o.id ? (
                                    <span className="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full inline-block" />
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export { BreaksSection }
export default BreaksSection
