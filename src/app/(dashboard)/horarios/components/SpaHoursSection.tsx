'use client'

import { Clock, Check } from 'lucide-react'

interface SpaHoursSectionProps {
  spaHours: { spa_opening_time: string; spa_closing_time: string }
  onSpaHoursChange: (hours: { spa_opening_time: string; spa_closing_time: string }) => void
  onSave: () => void
  isSaving: boolean
  saved: boolean
}

export function SpaHoursSection({
  spaHours,
  onSpaHoursChange,
  onSave,
  isSaving,
  saved,
}: SpaHoursSectionProps) {
  return (
    <section className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50">
          Horario del Spa
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Apertura
            </label>
            <input
              type="time"
              value={spaHours.spa_opening_time}
              onChange={(e) => onSpaHoursChange({ ...spaHours, spa_opening_time: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Cierre
            </label>
            <input
              type="time"
              value={spaHours.spa_closing_time}
              onChange={(e) => onSpaHoursChange({ ...spaHours, spa_closing_time: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors"
            />
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm
            transition-all duration-200
            ${saved
              ? 'bg-emerald-500 text-white'
              : 'bg-[#0F4C5C] dark:bg-[#38BDF8] text-white hover:opacity-90'
            }
            disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer
          `}
        >
          {isSaving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Este horario define los límites de disponibilidad para todas las citas.
      </p>
    </section>
  )
}