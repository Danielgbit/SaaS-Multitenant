'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

export default function ConfirmationsLoading() {
  const COLORS = useThemeColors()
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg" style={{ backgroundColor: COLORS.textMuted + '15' }} />
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-28 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '15' }} />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: COLORS.textMuted + '10' }} />
        ))}
      </div>
    </div>
  )
}
