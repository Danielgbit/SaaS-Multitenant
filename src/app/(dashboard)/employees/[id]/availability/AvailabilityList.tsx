'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, Calendar, Clock } from 'lucide-react'
import { deleteAvailability } from '@/actions/availability/deleteAvailability'
import { WEEKDAYS } from '@/types/availability'
import type { EmployeeAvailability } from '@/types/availability'

interface Props {
  availability: EmployeeAvailability[]
  employeeId: string
}

export function AvailabilityList({ availability, employeeId }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Ordenar por día de la semana
  const sortedAvailability = [...availability].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week
    }
    return a.start_time.localeCompare(b.start_time)
  })

  function handleDelete(availabilityId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) {
      return
    }

    setDeletingId(availabilityId)

    startTransition(async () => {
      const result = await deleteAvailability(availabilityId, employeeId)
      
      setDeletingId(null)
      
      if (result.error) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    })
  }

  if (availability.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          No hay horarios configurados para este empleado. 
          Agrega su primer horario de trabajo.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3" role="list" aria-label="Horarios configurados">
      {sortedAvailability.map((item, index) => {
        const dayInfo = WEEKDAYS.find((d) => d.value === item.day_of_week)
        const isDeleting = deletingId === item.id

        return (
          <li
            key={item.id}
            className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#0F4C5C]/30 dark:hover:border-[#38BDF8]/30 hover:shadow-sm transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <span className="text-sm font-bold text-[#0F4C5C] dark:text-[#38BDF8]">
                  {dayInfo?.short}
                </span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {dayInfo?.label}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.start_time} — {item.end_time}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(item.id)}
              disabled={isDeleting || isPending}
              className="p-3 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Eliminar horario del ${dayInfo?.label}`}
              title="Eliminar horario"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
