'use client'

import { useMemo } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Calendar, Clock } from 'lucide-react'

interface Props {
  appointments: Record<string, any>[]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateOnly = new Date(d)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) return 'Hoy'
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Mañana'

  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function MiAgendaCard({ appointments }: Props) {
  const colors = useThemeColors()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof appointments>()
    for (const apt of appointments) {
      const key = formatDate(apt.start_time)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(apt)
    }
    return [...map.entries()]
  }, [appointments])

  if (appointments.length === 0) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Mi Agenda</h3>
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>No tienes citas programadas para los próximos 7 días.</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
          <Calendar className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Mi Agenda</h3>
      </div>

      <div className="space-y-4">
        {grouped.map(([dateLabel, slots]) => (
          <div key={dateLabel}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>
              {dateLabel}
            </p>
            <div className="space-y-1.5">
              {slots.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: colors.surfaceSubtle }}
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: colors.primary }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(apt.start_time)}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {apt.clients?.name || 'Cliente'}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full ml-auto"
                    style={{
                      background: apt.status === 'pending' ? colors.warningLight : colors.successLight,
                      color: apt.status === 'pending' ? colors.warning : colors.success,
                    }}
                  >
                    {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
