'use client'

import { useState } from 'react'
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDuration } from '@/lib/utils/formatTime'
import { SlotGrid } from './SlotGrid'
import type { ThemeColors } from '@/hooks/useThemeColors'

interface Service { id: string; name: string; duration: number; price: number }
interface Employee { id: string; name: string }
interface TimeSlot { start_time: string; end_time: string; available: boolean; blockedReason?: string }

export function StepDateTime({
  selectedService, selectedEmployee, selectedDate, selectedSlot, availableSlots, loadingSlots,
  employees, colors,
  onSelectEmployee, onSelectDate, onSelectSlot, onContinue, onBack,
}: {
  selectedService: Service | null
  selectedEmployee: Employee | null
  selectedDate: string
  selectedSlot: string
  availableSlots: TimeSlot[]
  loadingSlots: boolean
  employees: Employee[]
  colors: ThemeColors
  onSelectEmployee: (emp: Employee) => void
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: string) => void
  onContinue: () => void
  onBack: () => void
}) {
  const [hoverContinue, setHoverContinue] = useState(false)

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.primary + '15' }}>
          <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          ¿Cuándo quieres venir?
        </h2>
      </div>

      {/* Selected Service Summary */}
      <div className="mb-8 p-4" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.surfaceSubtle }}>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: colors.textSecondary }}>{selectedService?.name}</span>
          <span className="text-sm font-medium" style={{ color: colors.primary }}>{formatDuration(selectedService?.duration || 0)}</span>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
          Selecciona profesional
        </label>
        {employees.length === 0 ? (
          <div className="text-center py-6" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.surfaceSubtle }}>
            <User className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
            <p className="text-sm" style={{ color: colors.textSecondary }}>No hay profesionales disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => { onSelectEmployee(emp) }}
                className="p-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderRadius: colors.radius.sm,
                  backgroundColor: selectedEmployee?.id === emp.id ? colors.primary + '15' : colors.surfaceSubtle,
                  border: `1px solid ${selectedEmployee?.id === emp.id ? colors.primary : colors.border}`,
                  transition: colors.transition,
                  ['--tw-ring-color' as string]: colors.borderFocus,
                }}
              >
                <User className="w-5 h-5 mx-auto mb-1" style={{ color: selectedEmployee?.id === emp.id ? colors.primary : colors.textMuted }} />
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{emp.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div className="mb-8">
        <label htmlFor="booking-date" className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
          Selecciona fecha
        </label>
        <input
          id="booking-date"
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => { onSelectDate(e.target.value) }}
          className="w-full px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: colors.radius.sm, border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textPrimary, transition: colors.transition, ['--tw-ring-color' as string]: colors.borderFocus }}
        />
      </div>

      {/* Slots */}
      {selectedDate && selectedEmployee && (
        <div className="mb-8">
          {loadingSlots ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16"
                  style={{
                    borderRadius: colors.radius.sm,
                    backgroundColor: colors.surfaceSubtle,
                    animation: 'booking-pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.surfaceSubtle }}>
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No encontramos horarios para esta fecha</p>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Intenta con otra fecha o profesional</p>
            </div>
          ) : (
            <SlotGrid
              slots={availableSlots}
              selectedSlot={selectedSlot}
              colors={colors}
              onSelect={onSelectSlot}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onBack} className="px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: colors.radius.button, color: colors.textSecondary, backgroundColor: colors.surfaceSubtle, transition: colors.transition, ['--tw-ring-color' as string]: colors.borderFocus }}
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Atrás
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedSlot}
          onMouseEnter={() => setHoverContinue(true)}
          onMouseLeave={() => setHoverContinue(false)}
          className="flex-1 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            borderRadius: colors.radius.button,
            backgroundColor: selectedSlot ? colors.primary : colors.surfaceSubtle,
            color: selectedSlot ? colors.surface : colors.textSecondary,
            cursor: selectedSlot ? 'pointer' : 'not-allowed',
            transition: colors.transition,
            transform: hoverContinue && selectedSlot ? 'translateY(-1px)' : 'none',
            boxShadow: hoverContinue && selectedSlot ? `0 4px 12px ${colors.primary}40` : 'none',
            ['--tw-ring-color' as string]: colors.borderFocus,
          }}
        >
          Continuar <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </div>
  )
}
