'use client'

import { CheckCircle2, Clock } from 'lucide-react'
import { formatTime } from '@/lib/utils/formatTime'

interface TimeSlot { start_time: string; end_time: string; available: boolean; blockedReason?: string }
interface BookingColors {
  primary: string; surface: string; surfaceSubtle: string; border: string
  textPrimary: string; textSecondary: string; textMuted: string
  success: string; warning: string
}

function SlotBlock({ slot, isSelected, colors }: {
  slot: TimeSlot
  isSelected: boolean
  colors: BookingColors
}) {
  const startTime = formatTime(slot.start_time)
  const endTime = formatTime(slot.end_time)
  const isAvailable = slot.available

  return (
    <div
      className={`relative rounded-xl p-4 transition-all duration-200 ${isAvailable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}`}
      style={{
        backgroundColor: isAvailable ? (isSelected ? colors.primary : colors.surfaceSubtle) : colors.surfaceSubtle,
        border: `2px solid ${isAvailable ? (isSelected ? colors.primary : colors.success + '40') : colors.border}`,
        borderLeft: `4px solid ${isAvailable ? colors.success : slot.blockedReason ? colors.warning : colors.border}`,
        boxShadow: isSelected ? `0 4px 16px ${colors.primary}30` : 'none',
        opacity: isAvailable ? 1 : 0.7,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold" style={{ color: isAvailable ? colors.textPrimary : colors.textMuted }}>
          {startTime} → {endTime}
        </span>
        {isAvailable ? (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success }}>
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warning }}>
            <Clock className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isAvailable ? colors.success + '15' : colors.warning + '15', color: isAvailable ? colors.success : colors.warning }}>
        {slot.available ? 'Disponible' : (slot.blockedReason || 'Ocupado')}
      </span>

      {!isAvailable && slot.blockedReason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap"
          style={{ backgroundColor: colors.textPrimary, color: colors.surface, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {slot.blockedReason}
        </div>
      )}
    </div>
  )
}

function SlotSection({ title, gradient, badge, slots, selectedSlot, colors, onSelect }: {
  title: string; gradient: string; badge: string
  slots: TimeSlot[]; selectedSlot: string; colors: BookingColors
  onSelect: (slot: string) => void
}) {
  if (slots.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${gradient}`} />
        <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: colors.textPrimary }}>{title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.surfaceSubtle, color: colors.textMuted }}>{badge}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {slots.map(slot => (
          <SlotBlock
            key={slot.start_time}
            slot={slot}
            isSelected={selectedSlot === slot.start_time}
            colors={colors}
          />
        ))}
      </div>
    </div>
  )
}

export function SlotGrid({ slots, selectedSlot, colors, onSelect }: {
  slots: TimeSlot[]
  selectedSlot: string
  colors: BookingColors
  onSelect: (slot: string) => void
}) {
  const morning = slots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) < 13)
  const afternoon = slots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) >= 13)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }} />
        <span>Disponible</span>
        <div className="w-2 h-2 rounded-full ml-2" style={{ backgroundColor: colors.warning }} />
        <span>Ocupado</span>
      </div>

      <SlotSection
        title="Mañana" gradient="bg-gradient-to-r from-amber-400 to-orange-400" badge="Antes de 1 PM"
        slots={morning} selectedSlot={selectedSlot} colors={colors} onSelect={onSelect}
      />

      <SlotSection
        title="Tarde" gradient="bg-gradient-to-r from-indigo-400 to-purple-400" badge="Desde 1 PM"
        slots={afternoon} selectedSlot={selectedSlot} colors={colors} onSelect={onSelect}
      />

      <div className="flex items-center justify-center gap-6 pt-4 border-t" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.success }} />
          <span className="text-xs" style={{ color: colors.textSecondary }}>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.warning }} />
          <span className="text-xs" style={{ color: colors.textSecondary }}>Ocupado - hover para razón</span>
        </div>
      </div>
    </div>
  )
}
