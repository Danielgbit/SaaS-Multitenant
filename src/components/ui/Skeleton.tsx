'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'metric'
  width?: string
  height?: string
  className?: string
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const COLORS = useThemeColors()
  const bg = COLORS.textMuted + '20'

  if (variant === 'circular') {
    return (
      <div
        className={`animate-pulse rounded-full ${width || 'w-10'} ${height || 'h-10'} ${className}`}
        style={{ backgroundColor: bg }}
      />
    )
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`animate-pulse rounded-xl ${width || 'w-full'} ${height || 'h-24'} ${className}`}
        style={{ backgroundColor: bg }}
      />
    )
  }

  if (variant === 'metric') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse rounded w-24 h-4" style={{ backgroundColor: bg }} />
        <div className="animate-pulse rounded w-32 h-8" style={{ backgroundColor: bg }} />
        <div className="animate-pulse rounded w-16 h-4" style={{ backgroundColor: bg }} />
      </div>
    )
  }

  return (
    <div
      className={`animate-pulse rounded ${width || 'w-full'} ${height || 'h-4'} ${className}`}
      style={{ backgroundColor: bg }}
    />
  )
}
