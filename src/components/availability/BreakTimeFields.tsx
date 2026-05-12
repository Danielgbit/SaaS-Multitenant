'use client'

import type { ReactNode } from 'react'
import { Coffee } from 'lucide-react'

interface BreakTimeFieldsProps {
  breakStart: string
  breakEnd: string
  breakReason: string
  onChange: (field: 'break_start' | 'break_end' | 'break_reason', value: string) => void
  disabled?: boolean
  variant?: 'light' | 'dark'
  placeholder?: string
  label?: string
  icon?: ReactNode
}

export function BreakTimeFields({
  breakStart,
  breakEnd,
  breakReason,
  onChange,
  disabled,
  variant = 'light',
  placeholder = 'Ej: Almuerzo',
  label = 'Descanso',
  icon = <Coffee className="w-4 h-4" />,
}: BreakTimeFieldsProps) {
  const isDark = variant === 'dark'
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
    isDark
      ? 'border-slate-600/50 bg-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8]'
      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]'
  }`

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {icon}
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="break_start" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Inicio descanso
          </label>
          <input
            type="time"
            id="break_start"
            value={breakStart}
            onChange={(e) => onChange('break_start', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="break_end" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Fin descanso
          </label>
          <input
            type="time"
            id="break_end"
            value={breakEnd}
            onChange={(e) => onChange('break_end', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="break_reason" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Motivo
          </label>
          <input
            type="text"
            id="break_reason"
            value={breakReason}
            onChange={(e) => onChange('break_reason', e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClass}
            maxLength={100}
          />
        </div>
      </div>
    </div>
  )
}
