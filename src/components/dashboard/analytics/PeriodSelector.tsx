'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Calendar, ChevronDown } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
  isDark?: boolean
}

const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'year', label: 'Este año' },
]

export function PeriodSelector({ value, onChange, isDark: isDarkProp }: PeriodSelectorProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  
  const isDark = isDarkProp ?? theme === 'dark'
  
  const COLORS = {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceSubtle: isDark ? '#334155' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
  }
  
  const currentLabel = periods.find(p => p.value === value)?.label || 'Este mes'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer"
        style={{ 
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.surface, 
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : COLORS.border,
          color: isDark ? '#FFFFFF' : COLORS.textPrimary,
          backdropFilter: isDark ? 'blur(8px)' : 'none'
        }}
      >
        {isDark ? (
          <Calendar className="w-4 h-4 text-white/80" />
        ) : (
          <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
        )}
        <span 
          className="text-sm font-medium"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {currentLabel}
        </span>
        <ChevronDown 
          className="w-4 h-4 transition-transform duration-200"
          style={{ 
            color: isDark ? 'rgba(255,255,255,0.6)' : COLORS.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 overflow-hidden backdrop-blur-xl"
            style={{ 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : COLORS.surface, 
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border 
            }}
          >
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => {
                  onChange(period.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:opacity-80 cursor-pointer"
                style={{ 
                  backgroundColor: value === period.value ? COLORS.primary + '15' : 'transparent',
                  color: value === period.value ? COLORS.primary : isDark ? '#E2E8F0' : COLORS.textSecondary,
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
