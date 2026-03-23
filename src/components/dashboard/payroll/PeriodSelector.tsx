'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

type PeriodType = 'day' | 'week' | 'month' | 'custom'

interface PeriodSelectorProps {
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
  onPeriodChange?: (type: PeriodType, start: string, end: string) => void
  colors?: {
    primary: string
    border: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    surface: string
    surfaceSubtle: string
  }
}

export function PeriodSelector({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onPeriodChange,
  colors,
}: PeriodSelectorProps) {
  const c = colors || {
    primary: '#0F4C5C',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    surface: '#FFFFFF',
    surfaceSubtle: '#F8FAFC',
  }

  const [activePeriod, setActivePeriod] = useState<PeriodType>('week')

  const getDateString = (date: Date) => date.toISOString().split('T')[0]

  const calculatePeriod = (type: PeriodType): { start: string; end: string } => {
    const today = new Date()
    
    switch (type) {
      case 'day': {
        return {
          start: getDateString(today),
          end: getDateString(today),
        }
      }
      case 'week': {
        const dayOfWeek = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
        monday.setHours(0, 0, 0, 0)
        
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        sunday.setHours(23, 59, 59, 999)
        
        return {
          start: getDateString(monday),
          end: getDateString(sunday),
        }
      }
      case 'month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        lastDay.setHours(23, 59, 59, 999)
        
        return {
          start: getDateString(firstDay),
          end: getDateString(lastDay),
        }
      }
      default:
        return { start: startDate, end: endDate }
    }
  }

  const handlePeriodClick = (type: PeriodType) => {
    if (type === 'custom') return
    
    setActivePeriod(type)
    const period = calculatePeriod(type)
    onStartChange(period.start)
    onEndChange(period.end)
    onPeriodChange?.(type, period.start, period.end)
  }

  const handleCustomDateChange = () => {
    setActivePeriod('custom')
    onPeriodChange?.('custom', startDate, endDate)
  }

  const formatDisplayRange = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    
    if (startDate === endDate) {
      return start.toLocaleDateString('es-ES', { ...options, year: 'numeric' })
    }
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
    }
    
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`
  }

  const periodButtons: { type: PeriodType; label: string }[] = [
    { type: 'day', label: 'Día' },
    { type: 'week', label: 'Semana' },
    { type: 'month', label: 'Mes' },
    { type: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-3">
      {/* Period Type Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {periodButtons.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handlePeriodClick(type)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activePeriod === type
                ? 'text-white shadow-md'
                : 'hover:opacity-80'
              }
            `}
            style={{
              backgroundColor: activePeriod === type ? c.primary : c.surfaceSubtle,
              color: activePeriod === type ? '#FFFFFF' : c.textSecondary,
              border: `1px solid ${activePeriod === type ? c.primary : c.border}`,
            }}
          >
            {label}
          </button>
        ))}
        
        <div className="flex items-center gap-2 ml-auto text-sm" style={{ color: c.textMuted }}>
          <Calendar className="w-4 h-4" />
          <span>{formatDisplayRange()}</span>
        </div>
      </div>

      {/* Date Inputs */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: c.textMuted }}>
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              onStartChange(e.target.value)
              if (activePeriod !== 'custom') setActivePeriod('custom')
            }}
            onBlur={handleCustomDateChange}
            className="px-4 py-2 rounded-xl border text-sm"
            style={{
              borderColor: c.border,
              color: c.textPrimary,
              backgroundColor: c.surface,
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: c.textMuted }}>
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              onEndChange(e.target.value)
              if (activePeriod !== 'custom') setActivePeriod('custom')
            }}
            onBlur={handleCustomDateChange}
            className="px-4 py-2 rounded-xl border text-sm"
            style={{
              borderColor: c.border,
              color: c.textPrimary,
              backgroundColor: c.surface,
            }}
          />
        </div>
      </div>
    </div>
  )
}