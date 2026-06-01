'use client'

import React, { type ReactNode } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'gold' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  pulse?: boolean
  children: ReactNode
  className?: string
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export const Badge = React.memo(function Badge({ variant = 'neutral', size = 'md', pulse = false, children, className = '' }: BadgeProps) {
  const COLORS = useThemeColors()

  const variantTokens: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: COLORS.successLight || '', text: COLORS.success },
    warning: { bg: COLORS.warningLight || '', text: COLORS.warning },
    error: { bg: COLORS.errorLight || '', text: COLORS.error },
    info: { bg: COLORS.infoLight || '', text: COLORS.info },
    primary: { bg: COLORS.primarySubtle, text: COLORS.primary },
    gold: { bg: COLORS.goldLight, text: COLORS.gold },
    neutral: { bg: COLORS.surfaceSubtle, text: COLORS.textMuted },
  }

  const tokens = variantTokens[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: tokens.bg,
        color: tokens.text,
      }}
    >
      {pulse && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: tokens.text }} />
      )}
      {children}
    </span>
  )
})
