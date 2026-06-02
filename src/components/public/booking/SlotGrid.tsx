'use client'

import { useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { formatTime } from '@/lib/utils/formatTime'
import type { ThemeColors } from '@/hooks/useThemeColors'

interface TimeSlot { start_time: string; end_time: string; available: boolean; blockedReason?: string }

function SlotBlock({ slot, isSelected, colors, onSelect }: {
  slot: TimeSlot
  isSelected: boolean
  colors: ThemeColors
  onSelect: (slot: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const startTime = formatTime(slot.start_time)
  const endTime = formatTime(slot.end_time)
  const isAvailable = slot.available

  const ariaLabel = isAvailable
    ? `Disponible ${startTime} a ${endTime}`
    : `Ocupado ${startTime} a ${endTime}${slot.blockedReason ? `: ${slot.blockedReason}` : ''}`

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={isAvailable ? () => onSelect(slot.start_time) : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      className={`relative p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isAvailable ? '' : 'cursor-not-allowed opacity-70'
      }`}
      style={{
        borderRadius: colors.radius.sm,
        backgroundColor: isAvailable ? (isSelected ? colors.primary : colors.surfaceSubtle) : colors.surfaceSubtle,
        border: `1px solid ${isAvailable ? (isSelected ? colors.primary : colors.border) : colors.border}`,
        boxShadow: isSelected ? `0 4px 16px ${colors.primary}30` : 'none',
        transition: colors.transition,
        ['--tw-ring-color' as string]: colors.borderFocus,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: isAvailable ? colors.textPrimary : colors.textMuted }}>
          {startTime}
        </span>
        {isAvailable ? (
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success }}>
            <CheckCircle2 className="w-2.5 h-2.5" style={{ color: colors.surface }} />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warning }}>
            <Clock className="w-2.5 h-2.5" style={{ color: colors.surface }} />
          </div>
        )}
      </div>

      {!isAvailable && slot.blockedReason && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs z-50 whitespace-nowrap"
          style={{ backgroundColor: colors.textPrimary, color: colors.surface, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {slot.blockedReason}
        </div>
      )}
    </button>
  )
}

function SlotSection({ title, dotColor, badge, slots, selectedSlot, colors, onSelect }: {
  title: string; dotColor: string; badge: string
  slots: TimeSlot[]; selectedSlot: string; colors: ThemeColors
  onSelect: (slot: string) => void
}) {
  if (slots.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor, border: `2px solid ${colors.surface}` }} />
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{title}</span>
        <span className="text-xs" style={{ color: colors.textSecondary }}>{badge}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {slots.map(slot => (
          <SlotBlock
            key={slot.start_time}
            slot={slot}
            isSelected={selectedSlot === slot.start_time}
            colors={colors}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

export function SlotGrid({ slots, selectedSlot, colors, onSelect }: {
  slots: TimeSlot[]
  selectedSlot: string
  colors: ThemeColors
  onSelect: (slot: string) => void
}) {
  const morning = slots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) < 13)
  const afternoon = slots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) >= 13)

  return (
    <div className="space-y-6">
      <SlotSection
        title="Mañana" dotColor={colors.accentTeal} badge="Antes de 1 PM"
        slots={morning} selectedSlot={selectedSlot} colors={colors} onSelect={onSelect}
      />

      <SlotSection
        title="Tarde" dotColor={colors.primary} badge="Desde 1 PM"
        slots={afternoon} selectedSlot={selectedSlot} colors={colors} onSelect={onSelect}
      />
    </div>
  )
}
