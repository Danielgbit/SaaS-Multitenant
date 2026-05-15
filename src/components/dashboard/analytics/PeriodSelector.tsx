'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Period } from './types'

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
}

const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'year', label: 'Este año' },
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const COLORS = useThemeColors()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLabel = periods.find(p => p.value === value)?.label || 'Este mes'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-md"
        style={{
          backgroundColor: COLORS.isDark ? 'rgba(255,255,255,0.1)' : COLORS.surface,
          borderColor: COLORS.isDark ? 'rgba(255,255,255,0.2)' : COLORS.border,
          color: COLORS.isDark ? '#FFFFFF' : COLORS.textPrimary,
          backdropFilter: COLORS.isDark ? 'blur(8px)' : 'none',
        }}
      >
        {COLORS.isDark ? (
          <Calendar className="w-4 h-4 text-white/80" />
        ) : (
          <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
        )}
        <span className="text-sm font-medium">
          {currentLabel}
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{
            color: COLORS.isDark ? 'rgba(255,255,255,0.6)' : COLORS.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
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
              backgroundColor: COLORS.isDark ? 'rgba(30, 41, 59, 0.95)' : COLORS.surface,
              borderColor: COLORS.isDark ? 'rgba(255,255,255,0.1)' : COLORS.border,
            }}
          >
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => {
                  onChange(period.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:opacity-80"
                style={{
                  backgroundColor: value === period.value ? COLORS.primary + '15' : 'transparent',
                  color: value === period.value ? COLORS.primary : COLORS.isDark ? '#E2E8F0' : COLORS.textSecondary,
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
