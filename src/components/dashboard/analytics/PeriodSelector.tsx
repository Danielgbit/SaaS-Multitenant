'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

const COLORS = {
  primary: '#0F4C5C',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
}

type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

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
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLabel = periods.find(p => p.value === value)?.label || 'Este mes'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border,
          color: COLORS.textPrimary
        }}
      >
        <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
        <span 
          className="text-sm font-medium"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {currentLabel}
        </span>
        <ChevronDown 
          className="w-4 h-4 transition-transform duration-200"
          style={{ 
            color: COLORS.textMuted,
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
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-lg z-20 overflow-hidden"
            style={{ 
              backgroundColor: COLORS.surface, 
              borderColor: COLORS.border 
            }}
          >
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => {
                  onChange(period.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
                style={{ 
                  backgroundColor: value === period.value ? COLORS.surfaceSubtle : 'transparent',
                  color: value === period.value ? COLORS.primary : COLORS.textSecondary,
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
