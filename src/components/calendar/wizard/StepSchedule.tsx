'use client'

import { useMemo, useRef } from 'react'
import { Calendar, Clock, FileText, AlertTriangle, Sparkles } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { SlotGrid } from '@/components/shared/SlotGrid'
import type { CalendarColors, Client, Employee, Service, TimeSlot, NewAppointmentData } from '@/types/calendar'
import { formatDuration, formatDate } from '@/lib/utils/formatTime'

interface StepScheduleProps {
  COLORS: CalendarColors
  newAppointmentData: NewAppointmentData
  availableSlots: TimeSlot[]
  loadingSlots: boolean
  slotsError: string | null
  selectedClient: Client | undefined
  selectedService: Service | undefined
  selectedEmployee: Employee | undefined
  onSetNewAppointmentData: (data: Partial<NewAppointmentData>) => void
  onFetchSlots: () => Promise<void>
}

export function StepSchedule({
  COLORS,
  newAppointmentData,
  availableSlots,
  loadingSlots,
  slotsError,
  selectedClient,
  selectedService,
  selectedEmployee,
  onSetNewAppointmentData,
  onFetchSlots,
}: StepScheduleProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const todayStr = new Date().toISOString().split('T')[0]

  const quickDates = useMemo(() => {
    const dates: { label: string; value: string }[] = []
    const now = new Date()
    dates.push({ label: 'Hoy', value: now.toISOString().split('T')[0] })
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    dates.push({ label: 'Mañana', value: tomorrow.toISOString().split('T')[0] })
    for (let i = 2; i <= 6; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' })
      dates.push({ label: dayName, value: d.toISOString().split('T')[0] })
    }
    return dates
  }, [])

  return (
    <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
      <div className="text-center">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '15' }}
        >
          <Calendar className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
        </div>
        <h4 className="text-lg sm:text-xl font-semibold mb-1 font-heading" style={{ color: COLORS.textPrimary }}>
          ¿Cuándo?
        </h4>
        <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
          Selecciona fecha, horario y añade notas
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
          Fecha rápida
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {quickDates.map(qd => {
            const isSelected = newAppointmentData.date === qd.value
            return (
              <button
                key={qd.value}
                onClick={() => { onSetNewAppointmentData({ date: qd.value, time: '' }) }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSubtle,
                  color: isSelected ? '#FFF' : COLORS.textPrimary,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                  boxShadow: isSelected ? `0 4px 12px ${COLORS.primary}30` : 'none'
                }}
              >
                {qd.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
          O elige una fecha
        </label>
        <input
          ref={dateInputRef}
          type="date"
          value={newAppointmentData.date}
          min={todayStr}
          onChange={e => onSetNewAppointmentData({ date: e.target.value, time: '' })}
          className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2"
          style={{
            borderColor: COLORS.border,
            backgroundColor: COLORS.surface,
            color: COLORS.textPrimary
          }}
        />
      </div>

      {newAppointmentData.date && newAppointmentData.employeeId && newAppointmentData.serviceId && (
        <div>
          {!loadingSlots && availableSlots.length === 0 && (
            <button
              onClick={onFetchSlots}
              className="w-full px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.primary,
                color: '#FFF',
                boxShadow: `0 4px 12px ${COLORS.primary}40`
              }}
            >
              <Clock className="w-4 h-4" />
              Ver horarios disponibles
            </button>
          )}

          {loadingSlots && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Spinner size="md" style={{ color: COLORS.primary }} />
              <span className="text-sm" style={{ color: COLORS.textMuted }}>Buscando horarios...</span>
            </div>
          )}

          {slotsError && !loadingSlots && (
            <div className="rounded-xl border-2 p-4" style={{ backgroundColor: COLORS.warningLight, borderColor: COLORS.warning + '40' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>Sin disponibilidad</p>
                  <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{slotsError}</p>
                  <button onClick={onFetchSlots} className="mt-3 text-xs font-semibold underline" style={{ color: COLORS.primary }}>
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {availableSlots.length > 0 && (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              <SlotGrid
                slots={availableSlots}
                selectedSlot={newAppointmentData.time}
                colors={COLORS}
                serviceDuration={selectedService?.duration}
                onSelect={(time) => onSetNewAppointmentData({ time })}
              />
              <div className="flex items-center justify-center gap-6 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                  <span className="text-xs" style={{ color: COLORS.textSecondary }}>Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.surfaceHover, border: `1px solid ${COLORS.border}` }} />
                  <span className="text-xs" style={{ color: COLORS.textSecondary }}>Disponible</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
          <FileText className="w-4 h-4" />
          Notas
          <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>(opcional)</span>
        </label>
        <textarea
          ref={notesRef}
          value={newAppointmentData.notes}
          onChange={e => onSetNewAppointmentData({ notes: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2 resize-none transition-all duration-200 focus:outline-none focus:ring-2 text-sm"
          rows={3}
          placeholder="Alguna nota adicional para la cita..."
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
        />
      </div>

      <div className="rounded-xl border-2 p-4 space-y-3" style={{ borderColor: COLORS.primary + '20', backgroundColor: COLORS.primary + '08' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.primary }}>
          Resumen de la cita
        </p>
        <div className="space-y-2">
          {selectedClient && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                {selectedClient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>{selectedClient.name}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Cliente</p>
              </div>
            </div>
          )}
          {selectedService && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>{selectedService.name}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatDuration(selectedService.duration)} &middot; ${new Intl.NumberFormat('es-CO').format(selectedService.price)}</p>
              </div>
            </div>
          )}
          {selectedEmployee && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>{selectedEmployee.name}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Profesional</p>
              </div>
            </div>
          )}
          {newAppointmentData.date && newAppointmentData.time && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                  {newAppointmentData.time} &middot; {formatDate(newAppointmentData.date, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Fecha y hora</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
