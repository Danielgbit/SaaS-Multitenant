'use client'

import { useState, useTransition } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Clock } from 'lucide-react'
import { updateBookingSettings } from '@/actions/settings/updateBookingSettings'
import { timeToMinutes } from '@/schemas/common'

interface Props {
  orgId: string
  onNext: () => void
  onSkip: () => void
}

const DAYS = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
]

export function HoursStep({ orgId, onNext, onSkip }: Props) {
  const colors = useThemeColors()
  const [opening, setOpening] = useState('09:00')
  const [closing, setClosing] = useState('20:00')
  const [selectedDays, setSelectedDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const toggleDay = (key: string) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedDays.length === 0) {
      setError('Selecciona al menos un día operativo')
      return
    }

    if (timeToMinutes(opening) >= timeToMinutes(closing)) {
      setError('La hora de cierre debe ser posterior a la apertura')
      return
    }

    startTransition(async () => {
      const result = await updateBookingSettings(orgId, {
        spa_opening_time: opening,
        spa_closing_time: closing,
      })
      if (result.success) {
        onNext()
      } else {
        setError(result.error || 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Horario de atención</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Define el horario de tu negocio</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Apertura</label>
          <input
            type="time"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: colors.surfaceSubtle, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Cierre</label>
          <input
            type="time"
            value={closing}
            onChange={(e) => setClosing(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: colors.surfaceSubtle, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-2 block" style={{ color: colors.textSecondary }}>Días operativos</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: selectedDays.includes(day.key) ? colors.primary : colors.surfaceSubtle,
                color: selectedDays.includes(day.key) ? '#FFF' : colors.textSecondary,
                border: `1px solid ${selectedDays.includes(day.key) ? colors.primary : colors.border}`,
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs mt-2" style={{ color: colors.error }}>{error}</p>
      )}

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={onSkip} className="text-sm px-4 py-2 rounded-xl transition-all" style={{ color: colors.textSecondary }}>
          Saltar este paso
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`, opacity: pending ? 0.6 : 1 }}
        >
          {pending ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </form>
  )
}
