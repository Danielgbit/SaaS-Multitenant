'use client'

import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from './Card'
import { Skeleton } from './Skeleton'

interface MetricCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  icon?: ReactNode
  iconColor?: string
  change?: number
  trendLabel?: string
  loading?: boolean
  onClick?: () => void
  footer?: ReactNode
  className?: string
}

export function MetricCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  iconColor,
  change,
  trendLabel,
  loading = false,
  onClick,
  footer,
  className = '',
}: MetricCardProps) {
  const COLORS = useThemeColors()
  const resolvedIconColor = iconColor || COLORS.primary
  const formattedValue = typeof value === 'number' ? value.toLocaleString('es-ES') : value
  const isPositive = change !== undefined && change >= 0

  if (loading) {
    return (
      <Card variant="glass" className={`p-5 ${className}`}>
        <Skeleton variant="metric" />
      </Card>
    )
  }

  return (
    <Card
      variant="glass"
      hover={onClick ? 'lift' : 'none'}
      className={`group p-5 ${className}`}
    >
      <div
        className={onClick ? 'cursor-pointer' : ''}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
            {title}
          </span>
          {icon && (
            <div
              className="p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor: COLORS.isDark
                  ? `${resolvedIconColor}20`
                  : `${resolvedIconColor}15`,
              }}
            >
              <span style={{ color: resolvedIconColor }}>{icon}</span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 mb-1">
          {prefix && (
            <span className="text-xl font-semibold" style={{ color: COLORS.textSecondary }}>
              {prefix}
            </span>
          )}
          <span className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
            {formattedValue}
          </span>
          {suffix && (
            <span className="text-lg font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              {suffix}
            </span>
          )}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
            ) : (
              <TrendingDown className="w-4 h-4" style={{ color: COLORS.error }} />
            )}
            <span
              className="text-sm font-semibold"
              style={{ color: isPositive ? COLORS.success : COLORS.error }}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
            {trendLabel && (
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                {trendLabel}
              </span>
            )}
          </div>
        )}

        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </Card>
  )
}
