'use client'

import { CalendarColors } from '@/types/calendar'

interface CalendarFooterProps {
  COLORS: CalendarColors
  appointmentsCount: number
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }>
}

export function CalendarFooter({ 
  COLORS, 
  appointmentsCount, 
  STATUS_CONFIG 
}: CalendarFooterProps) {
  return (
    <div 
      className="px-8 py-4 flex items-center justify-between"
      style={{ 
        borderTop: `1px solid ${COLORS.border}`, 
        backgroundColor: COLORS.surfaceSubtle 
      }}
    >
      <p className="text-sm" style={{ color: COLORS.textSecondary }}>
        <span className="font-semibold" style={{ color: COLORS.textPrimary }}>
          {appointmentsCount}
        </span> 
        {' '}cita{appointmentsCount !== 1 ? 's' : ''} esta semana
      </p>
      <div className="flex items-center gap-6">
        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([s, c]) => (
          <div key={s} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: c.color }} 
            />
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
