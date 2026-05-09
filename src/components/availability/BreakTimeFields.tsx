'use client'

import { Coffee } from 'lucide-react'

interface BreakTimeFieldsProps {
  breakStart: string
  breakEnd: string
  breakReason: string
  onChange: (field: 'break_start' | 'break_end' | 'break_reason', value: string) => void
  disabled?: boolean
}

export function BreakTimeFields({ breakStart, breakEnd, breakReason, onChange, disabled }: BreakTimeFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <Coffee className="w-4 h-4" />
        <span>Descanso</span>
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50"
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50"
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
            placeholder="Ej: Almuerzo"
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 disabled:opacity-50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            maxLength={100}
          />
        </div>
      </div>
    </div>
  )
}
