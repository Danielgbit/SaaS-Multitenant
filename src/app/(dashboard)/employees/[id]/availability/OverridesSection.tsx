'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, X, CalendarDays, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { createOverride, deleteOverride } from '@/actions/availability/overrideActions'
import { formatDate } from '@/lib/utils/formatTime'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { BreakTimeFields } from '@/components/availability/BreakTimeFields'

interface Override {
  id: string
  employee_id: string
  date: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean
  reason: string | null
  created_at: string
}

interface Props {
  employeeId: string
  overrides: Override[]
  employeeName: string
}

type DateFilter = '7days' | '30days' | 'all'

export function OverridesSection({ employeeId, overrides: initialOverrides, employeeName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days')

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formIsDayOff, setFormIsDayOff] = useState(false)
  const [formReason, setFormReason] = useState('')
  const [showBreak, setShowBreak] = useState(false)
  const [breakStart, setBreakStart] = useState('')
  const [breakEnd, setBreakEnd] = useState('')
  const [breakReason, setBreakReason] = useState('')

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)
  const [confirmDate, setConfirmDate] = useState('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredOverrides = initialOverrides.filter((o) => {
    const overrideDate = new Date(o.date + 'T00:00:00')
    if (dateFilter === '7days') {
      const limit = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return overrideDate >= today && overrideDate <= limit
    }
    if (dateFilter === '30days') {
      const limit = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      return overrideDate >= past && overrideDate <= limit
    }
    return true
  })

  const filterOptions: { value: DateFilter; label: string }[] = [
    { value: '7days', label: '7 días' },
    { value: '30days', label: '30 días' },
    { value: 'all', label: 'Todos' },
  ]

  function resetForm() {
    setFormDate('')
    setFormStartTime('')
    setFormEndTime('')
    setFormIsDayOff(false)
    setFormReason('')
    setShowBreak(false)
    setBreakStart('')
    setBreakEnd('')
    setBreakReason('')
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formDate) {
      toast.error('La fecha es requerida')
      return
    }

    if (!formIsDayOff && (!formStartTime || !formEndTime)) {
      toast.error('Si no es día libre, necesitas definir hora de inicio y fin')
      return
    }

    if (formStartTime && formEndTime && formStartTime >= formEndTime) {
      toast.error('La hora de fin debe ser mayor a la hora de inicio')
      return
    }

    if (showBreak && breakStart && breakEnd && breakStart >= breakEnd) {
      toast.error('La hora de inicio del descanso debe ser menor que la de fin')
      return
    }

    startTransition(async () => {
      toast.loading('Creando override...')

      const result = await createOverride({
        employee_id: employeeId,
        date: formDate,
        start_time: formStartTime || undefined,
        end_time: formEndTime || undefined,
        is_day_off: formIsDayOff,
        reason: formReason || undefined,
        break_start: showBreak ? breakStart || undefined : undefined,
        break_end: showBreak ? breakEnd || undefined : undefined,
      })

      toast.dismiss()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Override creado')
        resetForm()
        router.refresh()
      }
    })
  }

  function confirmDelete(overrideId: string, date: string) {
    setConfirmTarget(overrideId)
    setConfirmDate(date)
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return

    setDeletingId(confirmTarget)
    setConfirmOpen(false)

    const result = await deleteOverride(confirmTarget)

    setDeletingId(null)
    setConfirmTarget(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Override eliminado')
      router.refresh()
    }
  }

  function handleCancelDelete() {
    setConfirmOpen(false)
    setConfirmTarget(null)
  }

  return (
    <>
      <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
              <h2 className="text-lg font-display font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Excepciones
              </h2>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white transition-colors duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancelar' : 'Nueva excepción'}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cambios de horario para fechas específicas de {employeeName}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Create override form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-4 animate-fade-in">
              <h3 className="font-medium text-slate-800 dark:text-slate-200">
                Nueva excepción
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="override-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fecha
                  </label>
                  <input
                    type="date"
                    id="override-date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="override-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Razón (opcional)
                  </label>
                  <input
                    type="text"
                    id="override-reason"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="Vacaciones, capacitación, etc."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="override-start" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    id="override-start"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    disabled={formIsDayOff}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="override-end" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    id="override-end"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    disabled={formIsDayOff}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Day off toggle */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formIsDayOff}
                  onChange={(e) => setFormIsDayOff(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0F4C5C] focus:ring-[#0F4C5C] cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                  Día libre (no trabaja esta fecha)
                </span>
              </label>

              {/* Break times */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowBreak(!showBreak)}
                  disabled={isPending}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer"
                >
                  {showBreak ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showBreak ? 'Ocultar descanso' : 'Agregar descanso (opcional)'}
                </button>

                {showBreak && (
                  <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50">
                    <BreakTimeFields
                      breakStart={breakStart}
                      breakEnd={breakEnd}
                      breakReason={breakReason}
                      onChange={(field, value) => {
                        if (field === 'break_start') setBreakStart(value)
                        else if (field === 'break_end') setBreakEnd(value)
                        else if (field === 'break_reason') setBreakReason(value)
                      }}
                      disabled={isPending}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] disabled:opacity-50 text-white transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear excepción
                </button>
              </div>
            </form>
          )}

          {/* Date filter tabs */}
          {initialOverrides.length > 0 && (
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateFilter(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                    dateFilter === opt.value
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Overrides list */}
          {filteredOverrides.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {initialOverrides.length === 0
                  ? 'No hay excepciones configuradas.'
                  : 'No hay excepciones en este período.'}
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0F4C5C] dark:text-[#38BDF8] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear primera excepción
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOverrides.map((override) => {
                const overrideDate = new Date(override.date + 'T00:00:00')
                const isPast = overrideDate < today
                const isDeleting = deletingId === override.id

                return (
                  <div
                    key={override.id}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-colors duration-200
                      ${override.is_day_off
                        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-[#0F4C5C]/30 dark:hover:border-[#38BDF8]/30'
                      }
                      ${isPast ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        override.is_day_off
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10'
                      }`}>
                        {override.is_day_off ? (
                          <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {formatDate(override.date)}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          {override.is_day_off ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Día libre</span>
                          ) : (
                            <span>
                              {override.start_time || '?'} — {override.end_time || '?'}
                            </span>
                          )}
                          {override.reason && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="truncate max-w-[120px]">{override.reason}</span>
                            </>
                          )}
                          {isPast && (
                            <span className="text-slate-400 dark:text-slate-500 ml-1">(pasado)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => confirmDelete(override.id, override.date)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 cursor-pointer flex-shrink-0"
                      title="Eliminar excepción"
                      aria-label={`Eliminar excepción del ${override.date}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar excepción"
        description={`¿Eliminar la excepción de disponibilidad del ${confirmDate}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="warning"
      />
    </>
  )
}
