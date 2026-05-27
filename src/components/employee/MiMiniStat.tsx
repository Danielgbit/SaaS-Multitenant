'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

interface Props {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function MiMiniStat({ label, value, icon, trend }: Props) {
  const colors = useThemeColors()

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: colors.primarySubtle, color: colors.primary }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: colors.textSecondary }}>
          {label}
        </p>
        <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {value}
          {trend === 'up' && <span className="ml-1 text-xs text-green-500">↑</span>}
          {trend === 'down' && <span className="ml-1 text-xs text-red-500">↓</span>}
        </p>
      </div>
    </div>
  )
}
