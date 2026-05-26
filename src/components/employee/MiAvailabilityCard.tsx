'use client'

import { useState, useTransition } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Clock } from 'lucide-react'
import type { EmployeeAvailability } from '@/types/availability'

const DAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

interface DaySlot {
  day_of_week: number
  start_time: string
  end_time: string
}

interface Props {
  employeeId: string
  initialAvailability: EmployeeAvailability[]
}

export function MiAvailabilityCard({ employeeId, initialAvailability }: Props) {
  const colors = useThemeColors()

  const [slots, setSlots] = useState<DaySlot[]>(() =>
    initialAvailability.map((a) => ({
      day_of_week: a.day_of_week,
      start_time: a.start_time.slice(0, 5),
      end_time: a.end_time.slice(0, 5),
    }))
  )
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const getSlot = (day: number) => slots.find((s) => s.day_of_week === day)
  const isDayOn = (day: number) => slots.some((s) => s.day_of_week === day)

  const toggleDay = (day: number) => {
    setSaved(false)
    if (isDayOn(day)) {
      setSlots((prev) => prev.filter((s) => s.day_of_week !== day))
    } else {
      setSlots((prev) => [...prev, { day_of_week: day, start_time: '09:00', end_time: '18:00' }])
    }
  }

  const updateTime = (day: number, field: 'start_time' | 'end_time', value: string) => {
    setSaved(false)
    setSlots((prev) => prev.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s)))
  }

  const handleSave = () => {
    setError('')
    setSaved(false)

    for (const s of slots) {
      if (s.start_time >= s.end_time) {
        setError(`${DAYS[s.day_of_week].label}: la hora de inicio debe ser menor que la de fin.`)
        return
      }
    }

    startTransition(async () => {
      const { setMyAvailability } = await import('@/actions/employee/setMyAvailability')
      const result = await setMyAvailability({ availability: slots })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Mi Disponibilidad</h3>
        </div>
      </div>

      <div className="space-y-2">
        {DAYS.map((day) => {
          const on = isDayOn(day.value)
          const slot = getSlot(day.value)
          return (
            <div
              key={day.value}
              className="flex items-center gap-3 p-2 rounded-xl"
              style={{ background: colors.surfaceSubtle }}
            >
              <button
                type="button"
                onClick={() => toggleDay(day.value)}
                className="w-16 text-xs font-medium text-left"
                style={{ color: on ? colors.primary : colors.textMuted }}
              >
                {day.short}
              </button>
              {on ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={slot?.start_time || '09:00'}
                    onChange={(e) => updateTime(day.value, 'start_time', e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs outline-none w-20"
                    style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>a</span>
                  <input
                    type="time"
                    value={slot?.end_time || '18:00'}
                    onChange={(e) => updateTime(day.value, 'end_time', e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs outline-none w-20"
                    style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                </div>
              ) : (
                <span className="text-xs" style={{ color: colors.textMuted }}>Descanso</span>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs mt-2" style={{ color: colors.error }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
        style={{ background: saved ? colors.success : colors.primary, opacity: pending ? 0.6 : 1 }}
      >
        {pending ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
