'use client'

import { useState } from 'react'
import { Coffee, Plus, X, Check, Save, Calendar } from 'lucide-react'
import { setAvailability } from '@/actions/availability/setAvailability'
import { createOverride, deleteOverride } from '@/actions/availability/overrideActions'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeWithSchedules } from '@/types/availability'

interface BreaksSectionProps {
  organizationId: string
  employees: EmployeeWithSchedules[]
}

function BreaksSection({ organizationId, employees }: BreaksSectionProps) {
  const [savingDay, setSavingDay] = useState<string | null>(null)
  const [savedDay, setSavedDay] = useState<string | null>(null)
  const [isCreatingOverride, setIsCreatingOverride] = useState<string | null>(null)
  const [isDeletingOverride, setIsDeletingOverride] = useState<string | null>(null)

  // State for inline date-specific override forms per employee
  const [overrideForms, setOverrideForms] = useState<Record<string, { date: string; start_time: string; end_time: string; reason: string }>>({})

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
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center shadow-lg">
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

      {employees.length === 0 ? (
        <div className="text-center py-10">
          <Coffee className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">
            No hay empleados registrados. Crea empleados para configurar sus descansos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
              <div className="px-4 py-3 bg-slate-700/80 border-b border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-semibold text-xs">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-white text-sm">
                    {employee.name}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {employee.availability.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Sin horarios regulares configurados. Configura primero el horario del empleado.
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
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/20"
                        >
                          <input type="hidden" name="start_time" value={av.start_time} />
                          <input type="hidden" name="end_time" value={av.end_time} />

                          <div className="flex items-center gap-2 sm:w-28 flex-shrink-0">
                            <span className="text-sm font-medium text-slate-300 w-16">{day?.short}</span>
                            <span className="text-xs text-slate-500">
                              {av.start_time.slice(0, 5)}-{av.end_time.slice(0, 5)}
                            </span>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              name="has_break"
                              value="true"
                              defaultChecked={hasBreak}
                              onChange={(e) => {
                                const row = e.currentTarget.closest('form')
                                if (row) {
                                  const inputs = row.querySelectorAll('.break-input')
                                  inputs.forEach((el) => {
                                    const input = el as HTMLInputElement
                                    input.disabled = !e.currentTarget.checked
                                    if (!e.currentTarget.checked) input.value = ''
                                  })
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-500 text-[#38BDF8] focus:ring-[#38BDF8]/40 bg-slate-700 cursor-pointer"
                            />
                            <span className="text-xs text-slate-400">Descanso</span>
                          </label>

                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              name="break_start"
                              defaultValue={av.break_start || ''}
                              disabled={!hasBreak}
                              className={`${inputClass} break-input w-28 ${!hasBreak ? 'opacity-40' : ''}`}
                            />
                            <span className="text-slate-500 text-xs">→</span>
                            <input
                              type="time"
                              name="break_end"
                              defaultValue={av.break_end || ''}
                              disabled={!hasBreak}
                              className={`${inputClass} break-input w-28 ${!hasBreak ? 'opacity-40' : ''}`}
                            />
                          </div>

                          <input
                            type="text"
                            name="break_reason"
                            defaultValue={av.break_reason || 'Hora de almuerzo'}
                            disabled={!hasBreak}
                            placeholder="Motivo"
                            className={`${inputClass} break-input w-28 sm:w-32 ${!hasBreak ? 'opacity-40' : ''}`}
                          />

                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer flex-shrink-0 disabled:opacity-60"
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
                        </form>
                      )
                    })}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-600/30">
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

                  {getBreaksOverrides(employee).length > 0 && (
                    <div className="space-y-1">
                      {getBreaksOverrides(employee).map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span className="text-xs text-slate-300">
                              {new Date(o.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            <span className="text-xs text-slate-400">
                              {o.break_start?.slice(0, 5)} - {o.break_end?.slice(0, 5)}
                            </span>
                            {o.reason && (
                              <span className="text-xs text-slate-500">· {o.reason}</span>
                            )}
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
          ))}
        </div>
      )}
    </section>
  )
}

export { BreaksSection }
export default BreaksSection
