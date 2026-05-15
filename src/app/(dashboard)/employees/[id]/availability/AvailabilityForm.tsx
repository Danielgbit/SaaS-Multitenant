'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { setAvailability } from '@/actions/availability/setAvailability'
import { WEEKDAYS } from '@/types/availability'
import { BreakTimeFields } from '@/components/availability/BreakTimeFields'
import type { EmployeeAvailability } from '@/types/availability'

interface Props {
  employeeId: string
  existingAvailability: EmployeeAvailability[]
  preselectedDay?: number | null
  editItem?: (EmployeeAvailability & {
    break_start?: string | null
    break_end?: string | null
    break_reason?: string | null
  }) | null
  onCancel?: () => void
  onSuccess?: () => void
}

export function AvailabilityForm({
  employeeId,
  existingAvailability,
  preselectedDay,
  editItem,
  onCancel,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isEditing = !!editItem
  const takenDays = new Set(
    existingAvailability
      .filter((a) => !editItem || a.id !== editItem.id)
      .map((a) => a.day_of_week),
  )
  const availableDays = WEEKDAYS.filter((d) => !takenDays.has(d.value) || (isEditing && editItem?.day_of_week === d.value))

  const [dayOfWeek, setDayOfWeek] = useState<string>(
    editItem ? String(editItem.day_of_week) : preselectedDay !== null && preselectedDay !== undefined ? String(preselectedDay) : '',
  )
  const [startTime, setStartTime] = useState(editItem?.start_time || '')
  const [endTime, setEndTime] = useState(editItem?.end_time || '')
  const [showBreak, setShowBreak] = useState(!!(editItem?.break_start || editItem?.break_end))
  const [breakStart, setBreakStart] = useState(editItem?.break_start || '')
  const [breakEnd, setBreakEnd] = useState(editItem?.break_end || '')
  const [breakReason, setBreakReason] = useState(editItem?.break_reason || '')

  function reset() {
    setDayOfWeek(preselectedDay !== null && preselectedDay !== undefined ? String(preselectedDay) : '')
    setStartTime('')
    setEndTime('')
    setShowBreak(false)
    setBreakStart('')
    setBreakEnd('')
    setBreakReason('')
  }

  function handleCancel() {
    reset()
    onCancel?.()
  }

  function handleSubmit(formData: FormData) {
    const day = parseInt(formData.get('day_of_week') as string)
    const start = formData.get('start_time') as string
    const end = formData.get('end_time') as string

    if (start >= end) {
      toast.error('La hora de fin debe ser mayor a la hora de inicio')
      return
    }

    if (showBreak && breakStart && breakEnd) {
      if (breakStart >= breakEnd) {
        toast.error('La hora de inicio del descanso debe ser menor que la de fin')
        return
      }
    }

    startTransition(async () => {
      toast.loading(isEditing ? 'Actualizando horario...' : 'Guardando horario...')

      const result = await setAvailability({
        employee_id: employeeId,
        day_of_week: day,
        start_time: start,
        end_time: end,
        break_start: showBreak ? breakStart || null : null,
        break_end: showBreak ? breakEnd || null : null,
        break_reason: showBreak ? breakReason || null : null,
      })

      toast.dismiss()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Horario actualizado' : 'Horario agregado')
        reset()
        router.refresh()
        onSuccess?.()
      }
    })
  }

  if (!isEditing && availableDays.length === 0) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Todos los días de la semana ya tienen horario configurado.
        </p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="day_of_week" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Día
          </label>
          <select
            id="day_of_week"
            name="day_of_week"
            required
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            disabled={isPending || isEditing}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all duration-200 disabled:opacity-50 appearance-none cursor-pointer"
          >
            <option value="">Seleccionar</option>
            {availableDays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="start_time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Inicio
          </label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="end_time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Fin
          </label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Break times toggle */}
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
          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
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

      <div className="flex gap-3">
        {(isEditing || onCancel) && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px]"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 sm:flex-none min-w-[160px] px-6 py-3 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#0F4C5C]/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEditing ? 'Actualizando...' : 'Guardando...'}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Actualizar horario' : 'Agregar horario'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
