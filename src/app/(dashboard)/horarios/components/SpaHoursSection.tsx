'use client'

import { Clock, Check } from 'lucide-react'

interface SpaHoursSectionProps {
  spaHours: { spa_opening_time: string; spa_closing_time: string }
  onSpaHoursChange: (hours: { spa_opening_time: string; spa_closing_time: string }) => void
  onSave: () => void
  isSaving: boolean
  saved: boolean
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-700/50 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8] placeholder:text-slate-500 transition-all duration-200 cursor-pointer"

export function SpaHoursSection({
  spaHours,
  onSpaHoursChange,
  onSave,
  isSaving,
  saved,
}: SpaHoursSectionProps) {
  return (
    <section className="mb-8 p-5 sm:p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center shadow-lg">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
          Horario del Spa
        </h2>
      </div>

      {/* Form */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Apertura */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-slate-300 mb-2">
              Apertura
            </label>
            <input
              type="time"
              value={spaHours.spa_opening_time}
              onChange={(e) => onSpaHoursChange({ ...spaHours, spa_opening_time: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Cierre */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-slate-300 mb-2">
              Cierre
            </label>
            <input
              type="time"
              value={spaHours.spa_closing_time}
              onChange={(e) => onSpaHoursChange({ ...spaHours, spa_closing_time: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={
            "flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer min-w-[120px] " +
            (saved
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500/90"
              : "bg-[#38BDF8] text-white hover:bg-[#38BDF8]/90 hover:shadow-lg hover:shadow-[#38BDF8]/20") +
            " disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
          }
        >
          {isSaving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      {/* Footer */}
      <p className="mt-4 text-sm text-slate-400/80 leading-relaxed">
        Este horario define los límites de disponibilidad para todas las citas.
      </p>
    </section>
  )
}