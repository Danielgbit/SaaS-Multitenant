'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, CheckCircle2, AlertCircle, X, CalendarDays, Clock, Trash2 } from 'lucide-react'
import { createOverride, deleteOverride } from '@/actions/availability/overrideActions'
import { formatDate } from '@/lib/utils/formatTime'

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
}

export function OverridesSection({ employeeId, overrides }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formIsDayOff, setFormIsDayOff] = useState(false)
  const [formReason, setFormReason] = useState('')

  // Filter overrides: show upcoming and recent past (next 30 days, past 7 days)
  const today = new Date()
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const visibleOverrides = overrides.filter((o) => {
    const overrideDate = new Date(o.date)
    return overrideDate >= sevenDaysAgo && overrideDate <= thirtyDaysLater
  })

  function resetForm() {
    setFormDate('')
    setFormStartTime('')
    setFormEndTime('')
    setFormIsDayOff(false)
    setFormReason('')
    setShowForm(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formDate) {
      setError('La fecha es requerida.')
      return
    }

    if (!formIsDayOff && (!formStartTime || !formEndTime)) {
      setError('Si no es día libre, necesitas definir hora de inicio y fin.')
      return
    }

    startTransition(async () => {
      const result = await createOverride({
        employee_id: employeeId,
        date: formDate,
        start_time: formStartTime || undefined,
        end_time: formEndTime || undefined,
        is_day_off: formIsDayOff,
        reason: formReason || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        resetForm()
        window.location.reload()
      }
    })
  }

  function handleDelete(overrideId: string) {
    if (!confirm('¿Eliminar este override?')) return

    setDeletingId(overrideId)
    startTransition(async () => {
      const result = await deleteOverride(overrideId)
      if (result.error) {
        setError(result.error)
      } else {
        window.location.reload()
      }
      setDeletingId(null)
    })
  }

  return (
    <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
            <h2 className="text-lg font-display font-semibold text-[#0F4C5C] dark:text-[#F8FAFC]">
              Overrides de disponibilidad
            </h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancelar' : 'Crear override'}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cambios de horario para fechas específicas (ej: días libres, horarios especiales)
        </p>
      </div>

      <div className="p-6">
        {/* Form to create override */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-200">
              Nuevo override para {employeeId}
            </h3>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <label htmlFor="override-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Razón (opcional)
                </label>
                <input
                  type="text"
                  id="override-reason"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Vacaciones, día libre, etc."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="override-day-off"
                checked={formIsDayOff}
                onChange={(e) => setFormIsDayOff(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0F4C5C] focus:ring-[#0F4C5C]"
              />
              <label htmlFor="override-day-off" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Día libre (no trabaja este día)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0F4C5C] hover:bg-[#0C3E4A] disabled:opacity-50 text-white transition-colors duration-200 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear override
              </button>
            </div>
          </form>
        )}

        {/* List of overrides */}
        {visibleOverrides.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">
              No hay overrides configurados para los próximos 30 días.
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Usa &quot;Crear override&quot; para fechas especiales.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOverrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-[#0F4C5C]/30 dark:hover:border-[#38BDF8]/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${override.is_day_off ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10'}`}>
                    {override.is_day_off ? (
                      <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(override.date)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {override.is_day_off
                        ? 'Día libre'
                        : `${override.start_time || '?'} - ${override.end_time || '?'}`}
                      {override.reason && (
                        <span className="ml-2 text-slate-400 dark:text-slate-500">
                          • {override.reason}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(override.id)}
                  disabled={deletingId === override.id}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50"
                  title="Eliminar override"
                >
                  {deletingId === override.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
