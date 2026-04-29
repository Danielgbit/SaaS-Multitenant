'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CalendarOff, ArrowRight } from 'lucide-react'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeWithSchedules } from '@/types/availability'
import { formatTime12 } from '@/lib/utils/formatTime'

interface EmployeeScheduleCardProps {
  employee: EmployeeWithSchedules
}

export function EmployeeScheduleCard({ employee }: EmployeeScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const activeDays = employee.availability.map(a => a.day_of_week)
  const hasOverrides = employee.overrides.length > 0

  const scheduleString = activeDays.length > 0
    ? activeDays.map(d => WEEKDAYS.find(w => w.value === d)?.short || '').join(', ')
    : 'Sin horarios'

  const scheduleTime = employee.availability[0]
    ? `${formatTime12(employee.availability[0].start_time)} - ${formatTime12(employee.availability[0].end_time)}`
    : null

  return (
    <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-all duration-200 cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar con gradient mejorado */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-semibold text-sm">
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="text-left min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {employee.name}
            </p>
            {/* Solo mostrar resumen cuando esta colapsado */}
            {!isExpanded && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {scheduleString}
                {scheduleTime && ` · ${scheduleTime}`}
              </p>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Badge overrides compactado */}
          {hasOverrides && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/15 text-[#0F4C5C] dark:text-[#38BDF8]">
              +{employee.overrides.length}
            </span>
          )}

          {/* Chevron mejorado */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isExpanded
                ? 'bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/20'
                : 'bg-slate-100 dark:bg-slate-600/50'
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50">
          {/* Horario Regular */}
          <div className="mb-5">
            <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
              Horario Regular
            </h4>
            {employee.availability.length === 0 ? (
              <p className="text-sm text-slate-400 flex items-center gap-2 py-2">
                <CalendarOff className="w-4 h-4" />
                Sin horarios regulares configurados
              </p>
            ) : (
              <div className="space-y-0.5">
                {employee.availability.map((av) => {
                  const day = WEEKDAYS.find(w => w.value === av.day_of_week)
                  return (
                    <div
                      key={av.id}
                      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 w-24 sm:w-28">
                          {day?.label}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {formatTime12(av.start_time)} - {formatTime12(av.end_time)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Excepciones */}
          {employee.overrides.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
                Excepciones
              </h4>
              <div className="space-y-2">
                {employee.overrides.map((override) => (
                  <div
                    key={override.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-l-2 ${
                      override.is_day_off
                        ? 'bg-red-50/70 dark:bg-red-900/10 border-red-500'
                        : 'bg-amber-50/70 dark:bg-amber-900/10 border-amber-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          override.is_day_off ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(override.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {override.is_day_off
                          ? 'Día libre'
                          : `${formatTime12(override.start_time || '')} - ${formatTime12(override.end_time || '')}`
                        }
                      </span>
                      {override.reason && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                          · {override.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <a
              href={`/employees/${employee.id}/availability`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#0F4C5C]/30 dark:border-[#38BDF8]/30 text-[#0F4C5C] dark:text-[#38BDF8] hover:bg-[#0F4C5C]/5 dark:hover:bg-[#38BDF8]/10 transition-all duration-200"
            >
              <CalendarOff className="w-4 h-4" />
              Gestionar horarios
            </a>
          </div>
        </div>
      )}
    </div>
  )
}