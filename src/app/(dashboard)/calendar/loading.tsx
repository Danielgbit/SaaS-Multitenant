'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

export default function CalendarLoading() {
  const COLORS = useThemeColors()
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg" style={{ backgroundColor: COLORS.textMuted + '15' }} />
        <div className="h-8 w-32 rounded-lg" style={{ backgroundColor: COLORS.textMuted + '15' }} />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '15' }} />
        ))}
      </div>
    </div>
  )
}
