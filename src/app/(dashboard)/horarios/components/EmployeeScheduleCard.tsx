'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CalendarOff } from 'lucide-react'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeWithSchedules } from '@/types/availability'

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
    ? `${employee.availability[0].start_time.slice(0, 5)} - ${employee.availability[0].end_time.slice(0, 5)}`
    : null

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {employee.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {scheduleString}
              {scheduleTime && ` ${scheduleTime}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasOverrides && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8]">
              {employee.overrides.length} override{employee.overrides.length > 1 ? 's' : ''}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Horario Regular
            </h4>
            {employee.availability.length === 0 ? (
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <CalendarOff className="w-4 h-4" />
                Sin horarios regulares configurados
              </p>
            ) : (
              <div className="space-y-1">
                {employee.availability.map((av) => {
                  const day = WEEKDAYS.find(w => w.value === av.day_of_week)
                  return (
                    <div key={av.id} className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{day?.label}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {av.start_time.slice(0, 5)} - {av.end_time.slice(0, 5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {employee.overrides.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Excepciones (Overrides)
              </h4>
              <div className="space-y-2">
                {employee.overrides.map((override) => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-2">
                      {override.is_day_off ? (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(override.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {override.is_day_off
                        ? 'Día libre'
                        : `${override.start_time?.slice(0, 5)} - ${override.end_time?.slice(0, 5)}`
                      }
                    </span>
                    {override.reason && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        • {override.reason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <a
              href={`/employees/${employee.id}/availability`}
              className="text-sm font-medium text-[#0F4C5C] dark:text-[#38BDF8] hover:underline"
            >
              Gestionar horarios
            </a>
          </div>
        </div>
      )}
    </div>
  )
}