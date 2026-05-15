'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color?: string
  loading?: boolean
}

export function StatCard({ icon, label, value, color, loading }: StatCardProps) {
  const COLORS = useThemeColors()
  const iconColor = color || COLORS.primary
  const formattedValue = typeof value === 'number' ? value.toLocaleString('es-ES') : value

  if (loading) {
    return (
      <div
        className="p-5 rounded-2xl border animate-pulse"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <div className="h-4 w-24 rounded mb-3" style={{ backgroundColor: COLORS.textMuted + '30' }} />
        <div className="h-8 w-20 rounded mb-2" style={{ backgroundColor: COLORS.textMuted + '30' }} />
        <div className="h-3 w-16 rounded" style={{ backgroundColor: COLORS.textMuted + '30' }} />
      </div>
    )
  }

  return (
    <div
      className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
      style={{
        backgroundColor: COLORS.surfaceGlass,
        borderColor: COLORS.border,
        boxShadow: '0 2px 16px rgba(15, 76, 92, 0.06)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = COLORS.borderFocus
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-medium"
          style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {label}
        </span>
        <div
          className="p-2 rounded-xl transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: iconColor + '20' }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>

      <div className="flex items-end gap-1">
        <span
          className="text-3xl font-bold"
          style={{
            color: COLORS.textPrimary,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {formattedValue}
        </span>
      </div>
    </div>
  )
}