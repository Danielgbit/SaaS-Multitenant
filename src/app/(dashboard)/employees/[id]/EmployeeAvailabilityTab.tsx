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
  const [showForm, setShowForm] = useState(false)

  const takenDays = new Set(availability.map((a) => a.day_of_week))
  const availableDays = WEEKDAYS.filter((d) => !takenDays.has(d.value))

  function handleAdd(formData: FormData) {
    setError(null)

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-[#0F4C5C]/25">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
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
              group flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4d] hover:from-[#0C3E4A] hover:to-[#083242]
              text-white text-sm font-medium
              shadow-lg shadow-[#0F4C5C]/20 hover:shadow-xl hover:shadow-[#0F4C5C]/30
              transition-all duration-200
            "
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            Agregar
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="p-6 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <form action={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Día</label>
              <select
                name="day_of_week"
                required
                className="
                  w-full px-4 py-3 rounded-xl 
                  bg-white/80 dark:bg-slate-800/60
                  border border-slate-200/60 dark:border-slate-700/60
                  text-slate-900 dark:text-slate-100
                  shadow-md shadow-slate-200/20 dark:shadow-none
                  focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30
                  transition-all duration-200
                "
              >
                <option value="">Seleccionar</option>
                {availableDays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Inicio</label>
              <input
                type="time"
                name="start_time"
                required
                className="
                  w-full px-4 py-3 rounded-xl 
                  bg-white/80 dark:bg-slate-800/60
                  border border-slate-200/60 dark:border-slate-700/60
                  text-slate-900 dark:text-slate-100
                  shadow-md shadow-slate-200/20 dark:shadow-none
                  focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30
                  transition-all duration-200
                "
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fin</label>
              <input
                type="time"
                name="end_time"
                required
                className="
                  w-full px-4 py-3 rounded-xl 
                  bg-white/80 dark:bg-slate-800/60
                  border border-slate-200/60 dark:border-slate-700/60
                  text-slate-900 dark:text-slate-100
                  shadow-md shadow-slate-200/20 dark:shadow-none
                  focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30
                  transition-all duration-200
                "
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-medium shadow-lg shadow-[#0F4C5C]/20 disabled:opacity-50"
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
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
            Sin horarios configurados
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Agrega los días y horarios de trabajo de este empleado
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedAvailability.map((item, index) => {
            const dayInfo = WEEKDAYS.find(d => d.value === item.day_of_week)
            return (
              <li
                key={item.id}
                className="
                  group flex items-center justify-between p-4 rounded-xl 
                  bg-white/60 dark:bg-slate-800/40
                  border border-slate-200/50 dark:border-slate-700/40
                  hover:border-[#0F4C5C]/30 dark:hover:border-[#38BDF8]/30
                  hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-none
                  transition-all duration-200
                  animate-fade-in
                "
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F4C5C]/10 to-[#38BDF8]/10 dark:from-[#38BDF8]/10 dark:to-[#0F4C5C]/5 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#0F4C5C] dark:text-[#38BDF8]">
                      {dayInfo?.short}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {dayInfo?.label}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.start_time} — {item.end_time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="
                    p-2.5 rounded-xl 
                    text-slate-400 dark:text-slate-500
                    hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-900/20
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                  "
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
