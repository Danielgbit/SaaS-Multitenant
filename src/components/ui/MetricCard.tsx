'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from './Card'
import { Skeleton } from './Skeleton'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

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
  sparkline?: number[] // Optional sparkline data for premium KPIs
}

function CountUpNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const motionValue = useMotionValue(0)
  const displayValue = useTransform(motionValue, (v) => 
    isCurrency ? `$${v.toLocaleString('es-ES')}` : Math.round(v).toLocaleString('es-ES')
  )
  const prevValueRef = useRef<number>(0)

  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
    
    if (numValue !== prevValueRef.current) {
      prevValueRef.current = numValue
      motionValue.set(0)
      const controls = animate(motionValue, numValue, {
        duration: 0.4,
        ease: 'easeOut',
      })
      return controls.stop
    }
  }, [value, motionValue])

  return <motion.span>{displayValue}</motion.span>
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
  sparkline,
}: MetricCardProps) {
  const COLORS = useThemeColors()
  const resolvedIconColor = iconColor || COLORS.primary
  const formattedValue = typeof value === 'number' ? value.toLocaleString('es-ES') : value
  const isPositive = change !== undefined && change >= 0
  const isNumeric = typeof value === 'number'

  if (loading) {
    return (
      <Card variant="surface" className={`p-5 ${className}`}>
        <Skeleton variant="metric" />
      </Card>
    )
  }

  return (
    <Card
      variant="surface"
      hover={onClick ? 'glow' : 'none'}
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
          <span className="text-metric-label" style={{ color: COLORS.textSecondary }}>
            {title}
          </span>
          {icon && (
            <div
              className="p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{
                background: `radial-gradient(circle at center, ${COLORS.isDark ? COLORS.accentTealLight : COLORS.accentTealSubtle}, transparent)`,
              }}
            >
              <span style={{ color: resolvedIconColor }}>{icon}</span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 mb-1 relative">
          {prefix && (
            <span className="text-metric-label" style={{ color: COLORS.textSecondary }}>
              {prefix}
            </span>
          )}
          <span className="text-metric" style={{ color: COLORS.textPrimary }}>
            {isNumeric ? <CountUpNumber value={value as number} /> : formattedValue}
          </span>
          {suffix && (
            <span className="text-lg font-medium mb-1" style={{ color: COLORS.textSecondary }}>
              {suffix}
            </span>
          )}
          {sparkline && sparkline.length > 0 && (
            <div className="absolute bottom-0 right-0 w-20 h-10 opacity-30 pointer-events-none">
              <svg viewBox="0 0 80 40" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d={`M 0 40 ${sparkline.map((v, i) => `L ${(i / (sparkline.length - 1)) * 80} ${40 - (v / Math.max(...sparkline)) * 35}`).join(' ')}`}
                  fill={COLORS.accentTealSubtle}
                  stroke={COLORS.accentTeal}
                  strokeWidth="2"
                />
              </svg>
            </div>
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
              className="text-metric-change"
              style={{ color: isPositive ? COLORS.success : COLORS.error }}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
            {trendLabel && (
              <span className="text-body-xs" style={{ color: COLORS.textMuted }}>
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
