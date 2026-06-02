'use client'

import { CheckCircle2 } from 'lucide-react'
import { formatTime, formatDuration } from '@/lib/utils/formatTime'
import type { TimeSlot } from '@/types/slots'

interface SlotColors {
  surface: string
  surfaceSubtle: string
  surfaceHover: string
  border: string
  primary: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  warning: string
}

const PERIODS = {
  morning: {
    label: 'Mañana',
    badge: 'Antes de 1 PM',
    gradient: 'linear-gradient(135deg, #FBBF24, #FB923C)',
  },
  afternoon: {
    label: 'Tarde',
    badge: 'Desde 1 PM',
    gradient: 'linear-gradient(135deg, #818CF8, #C084FC)',
  },
} as const

function SlotBlock({
  slot,
  isSelected,
  serviceDuration,
  colors,
  onSelect,
}: {
  slot: TimeSlot
  isSelected: boolean
  serviceDuration?: number
  colors: SlotColors
  onSelect: (time: string) => void
}) {
  const isAvailable = slot.available
  const startTime = formatTime(slot.start_time)
  const endTime = formatTime(slot.end_time)

  if (!isAvailable) {
    return (
      <div
        className="relative rounded-xl text-left px-3 py-2.5 opacity-60 cursor-not-allowed select-none"
        style={{
          backgroundColor: colors.surfaceHover,
          border: `1px solid ${colors.border}`,
        }}
        title={slot.blockedReason}
      >
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold leading-none" style={{ color: colors.textMuted }}>
            {startTime}
          </span>
          <span className="text-xs" style={{ color: colors.textMuted }}>→</span>
          <span className="text-xs font-medium leading-none" style={{ color: colors.textMuted }}>
            {endTime}
          </span>
        </div>
        {slot.blockedReason && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-label px-1.5 py-0.5 rounded inline-block"
              style={{ backgroundColor: colors.warning + '20', color: colors.warning }}
            >
              {slot.blockedReason}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      key={slot.start_time}
      onClick={() => onSelect(formatTime(slot.start_time))}
      className={`relative overflow-hidden rounded-xl text-left transition-all duration-200 ${
        isSelected ? 'shadow-md' : 'hover:scale-[1.02] hover:shadow-sm'
      }`}
      style={{
        backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
        color: isSelected ? '#FFF' : colors.textPrimary,
        border: `1px solid ${isSelected ? colors.primary : colors.border}`,
        boxShadow: isSelected ? `0 4px 16px ${colors.primary}35` : 'none',
        padding: '12px 14px',
      }}
    >
      {isSelected && (
        <div
          className="absolute left-1 top-2 bottom-2 w-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
        />
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-bold leading-none">{startTime}</span>
        <span className="text-sm" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted }}>
          →
        </span>
        <span className="text-sm font-medium leading-none" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary }}>
          {endTime}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-body-xs flex items-center gap-1 font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : colors.success }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : colors.success }} />
          Disponible
        </span>
        {serviceDuration && (
          <span
            className="text-body-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : colors.primary + '12',
              color: isSelected ? 'rgba(255,255,255,0.9)' : colors.primary,
            }}
          >
            {formatDuration(serviceDuration)}
          </span>
        )}
      </div>
      {isSelected && (
        <div className="absolute top-1.5 right-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
        </div>
      )}
    </button>
  )
}

function SlotSection({
  period,
  slots,
  selectedSlot,
  serviceDuration,
  colors,
  onSelect,
}: {
  period: 'morning' | 'afternoon'
  slots: TimeSlot[]
  selectedSlot: string
  serviceDuration?: number
  colors: SlotColors
  onSelect: (time: string) => void
}) {
  if (slots.length === 0) return null

  const config = PERIODS[period]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 pb-1" style={{ backgroundColor: colors.surface }}>
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: config.gradient }}
        />
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {config.label}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.surfaceHover, color: colors.textMuted }}>
          {config.badge}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((slot, idx) => (
          <SlotBlock
            key={slot.start_time}
            slot={slot}
            isSelected={selectedSlot === formatTime(slot.start_time)}
            serviceDuration={serviceDuration}
            colors={colors}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

export function SlotGrid({
  slots,
  selectedSlot,
  colors,
  onSelect,
  serviceDuration,
}: {
  slots: TimeSlot[]
  selectedSlot: string
  colors: SlotColors
  onSelect: (time: string) => void
  serviceDuration?: number
}) {
  const morning = slots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) < 13)
  const afternoon = slots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) >= 13)

  return (
    <div className="space-y-6">
      <SlotSection
        period="morning"
        slots={morning}
        selectedSlot={selectedSlot}
        serviceDuration={serviceDuration}
        colors={colors}
        onSelect={onSelect}
      />
      <SlotSection
        period="afternoon"
        slots={afternoon}
        selectedSlot={selectedSlot}
        serviceDuration={serviceDuration}
        colors={colors}
        onSelect={onSelect}
      />
    </div>
  )
}
