'use client'

import { useState, useTransition } from 'react'
import { Clock, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { setAvailability } from '@/actions/availability/setAvailability'
import { deleteAvailability } from '@/actions/availability/deleteAvailability'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeAvailability } from '@/types/availability'

interface EmployeeAvailabilityTabProps {
  employeeId: string
  availability: EmployeeAvailability[]
}

export function EmployeeAvailabilityTab({ employeeId, availability: initialAvailability }: EmployeeAvailabilityTabProps) {
  const [availability, setAvailabilityState] = useState(initialAvailability)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const takenDays = new Set(availability.map((a) => a.day_of_week))
  const availableDays = WEEKDAYS.filter((d) => !takenDays.has(d.value))

  function handleAdd(formData: FormData) {
    setError(null)
    setSuccess(false)

    const dayOfWeek = parseInt(formData.get('day_of_week') as string)
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string

    if (startTime >= endTime) {
      setError('La hora de fin debe ser mayor a la hora de inicio')
      return
    }

    startTransition(async () => {
      const result = await setAvailability({
        employee_id: employeeId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setShowForm(false)
        window.location.reload()
      }
    })
  }

  function handleDelete(availabilityId: string) {
    if (!confirm('¿Eliminar este horario?')) return

    startTransition(async () => {
      await deleteAvailability(availabilityId, employeeId)
      setAvailabilityState(availability.filter(a => a.id !== availabilityId))
    })
  }

  const sortedAvailability = [...availability].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Horario de trabajo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {availability.length}/7 días configurados
            </p>
          </div>
        </div>
        {availableDays.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-[#0F4C5C] hover:bg-[#0C3E4A]
              text-white text-sm font-medium
              transition-colors duration-200
            "
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Horario agregado correctamente
            </div>
          )}

          <form action={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Día</label>
              <select
                name="day_of_week"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]"
              >
                <option value="">Seleccionar</option>
                {availableDays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Inicio</label>
              <input
                type="time"
                name="start_time"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fin</label>
              <input
                type="time"
                name="end_time"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-medium disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Agregar horario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Availability List */}
      {availability.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            No hay horarios configurados. Agrega el primer horario de trabajo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedAvailability.map((item) => {
            const dayInfo = WEEKDAYS.find(d => d.value === item.day_of_week)
            return (
              <li
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C]/30 dark:hover:border-[#38BDF8]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#0F4C5C] dark:text-[#38BDF8]">
                      {dayInfo?.short}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {dayInfo?.label}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.start_time} — {item.end_time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
