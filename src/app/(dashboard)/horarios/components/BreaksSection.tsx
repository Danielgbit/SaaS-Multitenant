'use client'

import { useState } from 'react'
import { Coffee, Plus, X, Check, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { setAvailability } from '@/actions/availability/setAvailability'
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
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({})

  // Bulk edit state
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null)

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
                  <Spinner size="sm" />
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
