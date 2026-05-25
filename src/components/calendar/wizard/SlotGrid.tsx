'use client'

import { CheckCircle2 } from 'lucide-react'
import type { CalendarColors, TimeSlot, Service } from '@/types/calendar'
import { formatTime, formatDuration } from '@/lib/utils/formatTime'

interface SlotGridProps {
  COLORS: CalendarColors
  slots: TimeSlot[]
  selectedTime: string
  selectedService: Service | undefined
  periodLabel: string
  periodBadge: string
  gradientFrom: string
  gradientTo: string
  onSelect: (time: string) => void
}

export function SlotGrid({
  COLORS,
  slots,
  selectedTime,
  selectedService,
  periodLabel,
  periodBadge,
  gradientFrom,
  gradientTo,
  onSelect,
}: SlotGridProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 pb-1" style={{ backgroundColor: COLORS.surface }}>
        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r from-${gradientFrom} to-${gradientTo}`} />
        <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
          {periodLabel}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textMuted }}>
          {periodBadge}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((s, idx) => {
          const isAvailable = s.available
          const isSelected = selectedTime === formatTime(s.start_time)
          const blockedReason = (s as any).blockedReason
          if (!isAvailable) {
            return (
              <div
                key={s.start_time}
                className="relative rounded-xl text-left px-3 py-2.5 opacity-60 cursor-not-allowed select-none"
                style={{
                  backgroundColor: COLORS.surfaceHover,
                  border: `1px solid ${COLORS.border}`,
                }}
                title={blockedReason}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold leading-none" style={{ color: COLORS.textMuted }}>
                    {formatTime(s.start_time)}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>→</span>
                  <span className="text-xs font-medium leading-none" style={{ color: COLORS.textMuted }}>
                    {formatTime(s.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-label px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>
                    {blockedReason || 'No disponible'}
                  </span>
                </div>
              </div>
            )
          }
          return (
            <button
              key={s.start_time}
              onClick={() => onSelect(formatTime(s.start_time))}
              className={`relative overflow-hidden rounded-xl text-left transition-all duration-200 ${
                isSelected ? 'shadow-md' : 'hover:scale-[1.02] hover:shadow-sm'
              }`}
              style={{
                backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSubtle,
                color: isSelected ? '#FFF' : COLORS.textPrimary,
                border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                boxShadow: isSelected ? `0 4px 16px ${COLORS.primary}35` : 'none',
                animationDelay: `${idx * 50}ms`,
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
                <span className="text-base font-bold leading-none">
                  {formatTime(s.start_time)}
                </span>
                <span className="text-sm" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }}>
                  →
                </span>
                <span className="text-sm font-medium leading-none" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : COLORS.textSecondary }}>
                  {formatTime(s.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-body-xs flex items-center gap-1 font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : COLORS.success }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : COLORS.success }} />
                  Disponible
                </span>
                {selectedService && (
                  <span
                    className="text-body-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : COLORS.primary + '12',
                      color: isSelected ? 'rgba(255,255,255,0.9)' : COLORS.primary,
                    }}
                  >
                    {formatDuration(selectedService.duration)}
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
        })}
      </div>
    </div>
  )
}
