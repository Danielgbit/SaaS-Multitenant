'use client'

import { useState } from 'react'
import { Calendar, Plus, X, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { createOverride, deleteOverride } from '@/actions/availability/overrideActions'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeWithSchedules } from '@/types/availability'
import { BreakTimeFields } from '@/components/availability/BreakTimeFields'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface ScheduleExceptionsSectionProps {
  organizationId: string
  employees: EmployeeWithSchedules[]
}

function getScheduleOverrides(employee: EmployeeWithSchedules) {
  return employee.overrides.filter(
    (o) => o.start_time && o.end_time && !o.break_start && !o.break_end
  )
}

function ScheduleExceptionsSection({ organizationId, employees }: ScheduleExceptionsSectionProps) {
  const [isCreatingOverride, setIsCreatingOverride] = useState<string | null>(null)
  const [isDeletingOverride, setIsDeletingOverride] = useState<string | null>(null)
  const [overrideForms, setOverrideForms] = useState<Record<string, { date: string; start_time: string; end_time: string; reason: string }>>({})
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({})

  const [quickOverrideEmpId, setQuickOverrideEmpId] = useState<string | null>(null)
  const [isSavingQuickOverride, setIsSavingQuickOverride] = useState(false)
  const [quickOverrideError, setQuickOverrideError] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  async function handleCreateOverride(employeeId: string) {
    setIsCreatingOverride(employeeId)

    const form = overrideForms[employeeId] || { date: '', start_time: '', end_time: '', reason: '' }

    const result = await createOverride({
      employee_id: employeeId,
      date: form.date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      is_day_off: false,
      reason: form.reason || 'Cambio de horario',
      break_start: undefined,
      break_end: undefined,
    })

    setIsCreatingOverride(null)
    if (result.success) {
      setOverrideForms((prev) => {
        const copy = { ...prev }
        delete copy[employeeId]
        return copy
      })
    }
  }

  async function handleDeleteOverride(overrideId: string) {
    setConfirmTarget(overrideId)
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return
    setIsDeletingOverride(confirmTarget)
    await deleteOverride(confirmTarget)
    setIsDeletingOverride(null)
    setConfirmOpen(false)
    setConfirmTarget(null)
  }

  function handleCancelDelete() {
    setConfirmOpen(false)
    setConfirmTarget(null)
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-600/50 bg-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] placeholder:text-slate-500 transition-all duration-200"

  return (
    <section className="mb-8 p-5 sm:p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
              Horarios Excepcionales
            </h2>
            <p className="text-sm text-slate-400">
              Cambios de horario puntuales por fecha específica
            </p>
          </div>
        </div>
      </div>

      {/* Employee list */}
      {employees.length === 0 ? (
        <div className="text-center py-10">
          <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No hay empleados registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => {
            const isExpanded = expandedEmployees[employee.id] ?? false
            const scheduleOverrides = getScheduleOverrides(employee)
            const hasOverrides = scheduleOverrides.length > 0

            let summary: string
            if (!hasOverrides) {
              summary = 'Sin excepciones de horario'
            } else {
              summary = `${scheduleOverrides.length} excepción${scheduleOverrides.length !== 1 ? 'es' : ''} programada${scheduleOverrides.length !== 1 ? 's' : ''}`
            }

            return (
              <div
                key={employee.id}
                className="border border-slate-600/30 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* ── Header ── */}
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
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
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {hasOverrides && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400">
                        +{scheduleOverrides.length}
                      </span>
                    )}
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        const empId = quickOverrideEmpId === employee.id ? null : employee.id
                        setQuickOverrideEmpId(empId)
                        if (empId) {
                          setOverrideForms((prev) => ({
                            ...prev,
                            [`quick:${employee.id}`]: { date: '', start_time: '', end_time: '', reason: '' },
                          }))
                        }
                        setQuickOverrideError(null)
                        setShowDatePicker(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          e.preventDefault()
                          const empId = quickOverrideEmpId === employee.id ? null : employee.id
                          setQuickOverrideEmpId(empId)
                          if (empId) {
                            setOverrideForms((prev) => ({
                              ...prev,
                              [`quick:${employee.id}`]: { date: '', start_time: '', end_time: '', reason: '' },
                            }))
                          }
                          setQuickOverrideError(null)
                          setShowDatePicker(false)
                        }
                      }}
                      role="button"
                      tabIndex={-1}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-600/50 hover:bg-amber-500/20 transition-all duration-200 cursor-pointer"
                      aria-label="Agregar horario excepcional"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isExpanded
                          ? 'bg-amber-500/20'
                          : 'bg-slate-600/50'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* ── Quick override panel ── */}
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
                              Horario Excepcional
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                              Cambio de horario para un día específico
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
                          const form = overrideForms[`quick:${employee.id}`]
                          if (!form?.date || !form.start_time || !form.end_time) {
                            setQuickOverrideError('Completa todos los campos.')
                            return
                          }
                          if (form.start_time >= form.end_time) {
                            setQuickOverrideError('El inicio debe ser antes del fin.')
                            return
                          }
                          setIsSavingQuickOverride(true)
                          setQuickOverrideError(null)
                          createOverride({
                            employee_id: employee.id,
                            date: form.date,
                            start_time: form.start_time,
                            end_time: form.end_time,
                            is_day_off: false,
                            reason: form.reason || 'Cambio de horario',
                            break_start: undefined,
                            break_end: undefined,
                          }).then((result) => {
                            setIsSavingQuickOverride(false)
                            if (result.success) {
                              setQuickOverrideEmpId(null)
                              setOverrideForms((prev) => {
                                const copy = { ...prev }
                                delete copy[`quick:${employee.id}`]
                                return copy
                              })
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
                            {WEEKDAYS.map((wd) => {
                              const nextDate = (() => {
                                const today = new Date()
                                const currentDay = today.getDay()
                                let diff = wd.value - currentDay
                                if (diff <= 0) diff += 7
                                const next = new Date(today)
                                next.setDate(today.getDate() + diff)
                                return next.toISOString().split('T')[0]
                              })()
                              const form = overrideForms[`quick:${employee.id}`]
                              const isSelected = form?.date === nextDate
                              return (
                                <button
                                  key={wd.value}
                                  type="button"
                                  onClick={() => {
                                    setOverrideForms((prev) => ({
                                      ...prev,
                                      [`quick:${employee.id}`]: { ...(prev[`quick:${employee.id}`] || { start_time: '', end_time: '', reason: '' }), date: nextDate },
                                    }))
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

                          {overrideForms[`quick:${employee.id}`]?.date && !showDatePicker && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-500/10">
                              <span className="text-[11px] text-slate-400">
                                → {new Date(overrideForms[`quick:${employee.id}`]!.date + 'T00:00:00').toLocaleDateString('es-ES', {
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
                                value={overrideForms[`quick:${employee.id}`]?.date || ''}
                                onChange={(e) =>
                                  setOverrideForms((prev) => ({
                                    ...prev,
                                    [`quick:${employee.id}`]: { ...(prev[`quick:${employee.id}`] || { start_time: '', end_time: '', reason: '' }), date: e.target.value },
                                  }))
                                }
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
                                  value={overrideForms[`quick:${employee.id}`]?.start_time || ''}
                                  onChange={(e) =>
                                    setOverrideForms((prev) => ({
                                      ...prev,
                                      [`quick:${employee.id}`]: { ...(prev[`quick:${employee.id}`] || { date: '', end_time: '', reason: '' }), start_time: e.target.value },
                                    }))
                                  }
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
                                  value={overrideForms[`quick:${employee.id}`]?.end_time || ''}
                                  onChange={(e) =>
                                    setOverrideForms((prev) => ({
                                      ...prev,
                                      [`quick:${employee.id}`]: { ...(prev[`quick:${employee.id}`] || { date: '', start_time: '', reason: '' }), end_time: e.target.value },
                                    }))
                                  }
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
                                  value={overrideForms[`quick:${employee.id}`]?.reason || ''}
                                  onChange={(e) =>
                                    setOverrideForms((prev) => ({
                                      ...prev,
                                      [`quick:${employee.id}`]: { ...(prev[`quick:${employee.id}`] || { date: '', start_time: '', end_time: '' }), reason: e.target.value },
                                    }))
                                  }
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
                      {/* Overrides */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Excepciones de horario
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setOverrideForms((prev) => ({
                                ...prev,
                                [employee.id]: prev[employee.id] || { date: '', start_time: '', end_time: '', reason: '' },
                              }))
                            }
                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </button>
                        </div>

                        {overrideForms[employee.id] && (
                          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-700/30 border border-slate-600/20 mb-3">
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
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <BreakTimeFields
                                breakStart={overrideForms[employee.id]?.start_time || ''}
                                breakEnd={overrideForms[employee.id]?.end_time || ''}
                                breakReason={overrideForms[employee.id]?.reason || ''}
                                onChange={(field, value) =>
                                  setOverrideForms((prev) => ({
                                    ...prev,
                                    [employee.id]: { ...prev[employee.id], [field]: value },
                                  }))
                                }
                                variant="dark"
                                placeholder="Motivo"
                                label="Horario excepcional"
                                icon={<Calendar className="w-4 h-4" />}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCreateOverride(employee.id)}
                              disabled={isCreatingOverride === employee.id}
                              className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-500/90 transition-all duration-200 disabled:opacity-60 cursor-pointer whitespace-nowrap"
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
                          </div>
                        )}

                        {hasOverrides && (
                          <div className="space-y-1">
                            {scheduleOverrides.map((o) => (
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
                                    {o.start_time?.slice(0, 5)} - {o.end_time?.slice(0, 5)}
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

                        {!hasOverrides && !overrideForms[employee.id] && (
                          <p className="text-sm text-slate-500 text-center py-4">
                            Sin excepciones de horario programadas.
                          </p>
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

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar excepción"
        description="¿Eliminar esta excepción de horario?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="warning"
      />
    </section>
  )
}

export { ScheduleExceptionsSection }
export default ScheduleExceptionsSection
