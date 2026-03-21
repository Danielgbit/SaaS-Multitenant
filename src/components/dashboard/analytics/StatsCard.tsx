'use client'

import { useTheme } from 'next-themes'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  iconColor?: string
  loading?: boolean
  delay?: number
}

export function StatsCard({ title, value, change, prefix = '', suffix = '', icon, iconColor = '#0F4C5C', loading, delay = 0 }: StatsCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const COLORS = {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    success: '#16A34A',
    error: '#DC2626',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
  }

  const isPositive = change !== undefined && change >= 0
  
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('es-ES') 
    : value

  if (loading) {
    return (
      <div 
        className="p-5 rounded-2xl border animate-pulse"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border 
        }}
      >
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    )
  }

  return (
    <div 
      className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
      style={{ 
        backgroundColor: COLORS.surfaceGlass, 
        borderColor: COLORS.border,
        boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
        backdropFilter: 'blur(12px)',
        animationDelay: `${delay}ms`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(15, 76, 92, 0.08)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span 
          className="text-sm font-medium"
          style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {title}
        </span>
        {icon && (
          <div 
            className="p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110"
            style={{ 
              backgroundColor: isDark ? `${iconColor}20` : `${iconColor}15`,
            }}
          >
            <span style={{ color: iconColor }}>
              {icon}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2 mb-1">
        {prefix && (
          <span 
            className="text-xl font-semibold"
            style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {prefix}
          </span>
        )}
        <span 
          className="text-3xl font-bold"
          style={{ 
            color: COLORS.textPrimary, 
            fontFamily: 'Plus Jakarta Sans, sans-serif' 
          }}
        >
          {formattedValue}
        </span>
        {suffix && (
          <span 
            className="text-lg font-medium mb-1"
            style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
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
            style={{ 
              color: isPositive ? COLORS.success : COLORS.error,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            {isPositive ? '+' : ''}{change}%
          </span>
          <span 
            className="text-xs"
            style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            vs período anterior
          </span>
        </div>
      )}
    </div>
  )
}
