'use client'

import { Plus, Trash2, Coffee } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { WEEKDAYS } from '@/types/availability'
import { formatTime12 } from '@/lib/utils/formatTime'
import type { EmployeeAvailability } from '@/types/availability'

interface WeekGridProps {
  availability: EmployeeAvailability[]
  onEdit: (item: EmployeeAvailability) => void
  onAdd: (dayOfWeek: number) => void
  onDelete: (id: string) => Promise<void>
  deletingId: string | null
}

export function WeekGrid({ availability, onEdit, onAdd, onDelete, deletingId }: WeekGridProps) {
  const availabilityByDay = new Map<number, EmployeeAvailability>()
  for (const item of availability) {
    const existing = availabilityByDay.get(item.day_of_week)
    if (!existing || item.start_time < existing.start_time) {
      availabilityByDay.set(item.day_of_week, item)
    }
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((day) => {
        const slot = availabilityByDay.get(day.value)
        const configured = !!slot

        return (
          <div
            key={day.value}
            className={`
              relative flex flex-col rounded-xl border transition-all duration-200 min-h-[160px] group
              ${configured
                ? 'bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/5 border-[#0F4C5C]/20 dark:border-[#38BDF8]/20 hover:border-[#0F4C5C]/40 dark:hover:border-[#38BDF8]/40 cursor-pointer'
                : 'bg-white dark:bg-[#1E293B] border-dashed border-slate-300 dark:border-slate-600 hover:border-[#0F4C5C]/40 dark:hover:border-[#38BDF8]/40 cursor-pointer'
              }
            `}
            onClick={() => {
              if (configured && slot) onEdit(slot)
              else onAdd(day.value)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (configured && slot) onEdit(slot)
                else onAdd(day.value)
              }
            }}
            aria-label={configured ? `Editar horario de ${day.label}` : `Agregar horario para ${day.label}`}
          >
            <div className={`
              px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider rounded-t-xl border-b
              ${configured
                ? 'text-[#0F4C5C] dark:text-[#38BDF8] bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 border-[#0F4C5C]/10 dark:border-[#38BDF8]/10'
                : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
              }
            `}>
              <span className="hidden sm:inline">{day.short}</span>
              <span className="sm:hidden">{day.short.slice(0, 2)}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-2">
              {configured && slot ? (
                <>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {formatTime12(slot.start_time)}
                    </p>
                    <div className="w-8 h-px bg-slate-300 dark:bg-slate-600 mx-auto my-1" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {formatTime12(slot.end_time)}
                    </p>
                  </div>

                  {slot.break_start && slot.break_end && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md truncate max-w-full">
                      <Coffee className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{slot.break_reason || 'Descanso'}</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(slot.id)
                    }}
                    disabled={deletingId === slot.id}
                    className="
                      absolute top-8 right-1.5 p-1.5 rounded-lg
                      text-slate-400 dark:text-slate-500
                      hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                      opacity-0 group-hover:opacity-100 transition-all duration-200
                      disabled:opacity-50
                    "
                    aria-label={`Eliminar horario de ${day.label}`}
                    title="Eliminar horario"
                  >
                    {deletingId === slot.id ? (
                      <Spinner size="sm" className="w-3.5 h-3.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                  <Plus className="w-5 h-5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Agregar</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
