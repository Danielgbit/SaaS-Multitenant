'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

const COLORS = {
  primary: '#0F4C5C',
  success: '#16A34A',
  error: '#DC2626',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
}

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  loading?: boolean
}

export function StatsCard({ title, value, change, prefix = '', suffix = '', icon, loading }: StatsCardProps) {
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
        <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
        <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>
    )
  }

  return (
    <div 
      className="p-5 rounded-2xl border transition-all duration-200 hover:shadow-md cursor-default"
      style={{ 
        backgroundColor: COLORS.surface, 
        borderColor: COLORS.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
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
            className="p-2 rounded-lg"
            style={{ backgroundColor: COLORS.surfaceSubtle }}
          >
            {icon}
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
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
          ) : (
            <TrendingDown className="w-4 h-4" style={{ color: COLORS.error }} />
          )}
          <span 
            className="text-sm font-medium"
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
