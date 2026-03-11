'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { setAvailability } from '@/actions/availability/setAvailability'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeAvailability } from '@/types/availability'

interface Props {
  employeeId: string
  existingAvailability: EmployeeAvailability[]
}

export function AvailabilityForm({ employeeId, existingAvailability }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Días que ya tienen horario configurado
  const takenDays = new Set(existingAvailability.map((a) => a.day_of_week))
  const availableDays = WEEKDAYS.filter((d) => !takenDays.has(d.value))

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)

    const dayOfWeek = parseInt(formData.get('day_of_week') as string)
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string

    // Validación: hora fin debe ser mayor a hora inicio
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
        window.location.reload()
      }
    })
  }

  if (availableDays.length === 0) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Todos los días de la semana ya tienen un horario configurado. 
          Elimina uno para agregar otro diferente.
        </p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Horario guardado correctamente.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label 
            htmlFor="day_of_week" 
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Día
          </label>
          <select
            id="day_of_week"
            name="day_of_week"
            required
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 disabled:opacity-50"
          >
            <option value="">Seleccionar</option>
            {availableDays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="start_time" 
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Inicio
          </label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            required
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="end_time" 
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Fin
          </label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            required
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto min-w-[160px] px-6 py-3 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#0F4C5C]/20 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Agregar horario
          </>
        )}
      </button>
    </form>
  )
}
