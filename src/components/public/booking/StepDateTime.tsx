'use client'

import { Calendar, User, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { formatTime, formatDuration, formatDate as formatDateUtil } from '@/lib/utils/formatTime'
import { SlotGrid } from './SlotGrid'

interface Service { id: string; name: string; duration: number; price: number }
interface Employee { id: string; name: string }
interface TimeSlot { start_time: string; end_time: string; available: boolean; blockedReason?: string }
interface BookingColors {
  primary: string; primaryLight: string; surface: string; surfaceSubtle: string
  border: string; borderLight: string; textPrimary: string; textSecondary: string
  textMuted: string; success: string; successLight: string; warning: string
  warningLight: string; error: string; errorLight: string
}

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
  colors: BookingColors
  onSelectEmployee: (emp: Employee) => void
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: string) => void
  onContinue: () => void
  onBack: () => void
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
          <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          ¿Cuándo quieres venir?
        </h2>
      </div>

      {/* Selected Service Summary */}
      <div className="mb-6 p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: colors.textSecondary }}>{selectedService?.name}</span>
          <span className="text-sm font-medium" style={{ color: colors.primary }}>{formatDuration(selectedService?.duration || 0)}</span>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
          Selecciona profesional
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => { onSelectEmployee(emp) }}
              className="p-3 rounded-xl text-center transition-all"
              style={{ 
                backgroundColor: selectedEmployee?.id === emp.id ? colors.primary + '15' : colors.surfaceSubtle,
                border: `1px solid ${selectedEmployee?.id === emp.id ? colors.primary : colors.border}`
              }}
            >
              <User className="w-5 h-5 mx-auto mb-1" style={{ color: selectedEmployee?.id === emp.id ? colors.primary : colors.textMuted }} />
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{emp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
          Selecciona fecha
        </label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => { onSelectDate(e.target.value) }}
          className="w-full px-4 py-3 rounded-xl"
          style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textPrimary }}
        />
      </div>

      {/* Slots */}
      {selectedDate && selectedEmployee && (
        <div className="mb-6">
          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" style={{ color: colors.primary }} />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-6 rounded-xl" style={{ backgroundColor: colors.surfaceSubtle }}>
              <p className="text-sm" style={{ color: colors.textMuted }}>No hay horarios disponibles para esta fecha.</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Intenta con otra fecha o profesional.</p>
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
      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-3 rounded-xl font-medium"
          style={{ color: colors.textSecondary, backgroundColor: colors.surfaceSubtle }}
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Atrás
        </button>
        <button onClick={onContinue} disabled={!selectedSlot} className="flex-1 py-3 rounded-xl font-medium"
          style={{ backgroundColor: selectedSlot ? colors.primary : colors.borderLight, color: selectedSlot ? '#FFF' : colors.textMuted }}
        >
          Continuar <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </div>
  )
}
