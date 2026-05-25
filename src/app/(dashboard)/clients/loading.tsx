'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

export default function ClientsLoading() {
  const COLORS = useThemeColors()
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg" style={{ backgroundColor: COLORS.textMuted + '15' }} />
        <div className="h-10 w-32 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '15' }} />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-48 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '15' }} />
        <div className="h-10 w-32 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '15' }} />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '10' }} />
        ))}
      </div>
    </div>
  )
}
