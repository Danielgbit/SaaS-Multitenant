'use client'

import { type ReactNode } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  const COLORS = useThemeColors()

  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: COLORS.primarySubtle }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mt-1 max-w-xs" style={{ color: COLORS.textMuted }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
