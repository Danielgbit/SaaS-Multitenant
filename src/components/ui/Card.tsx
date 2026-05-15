'use client'

import { type ReactNode } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface CardProps {
  children: ReactNode
  variant?: 'glass' | 'solid' | 'bordered'
  hover?: 'lift' | 'none'
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, variant = 'glass', hover = 'none', className = '', style }: CardProps) {
  const COLORS = useThemeColors()

  const hoverClasses = hover === 'lift'
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer'
    : ''

  const baseClasses = 'rounded-2xl border'

  return (
    <div
      className={`${baseClasses} ${variant === 'glass' ? 'backdrop-blur-md shadow-glass dark:shadow-glass-dark' : ''} ${hoverClasses} ${className}`}
      style={{
        ...(variant !== 'bordered' ? { backgroundColor: variant === 'solid' ? COLORS.surface : COLORS.surfaceGlass } : {}),
        borderColor: COLORS.border,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
