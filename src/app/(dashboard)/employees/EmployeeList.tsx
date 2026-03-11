'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Pencil, ToggleLeft, ToggleRight, Phone, UserCircle2, Loader2, Clock, Calendar, AlertCircle } from 'lucide-react'
import { toggleEmployeeStatus } from '@/actions/employees/toggleEmployeeStatus'
import { EditEmployeeModal } from './EditEmployeeModal'
import type { Employee } from '@/types/employees'
import type { AvailabilitySummary } from '@/services/availability/getAvailability'

interface EmployeeListProps {
  employees: Employee[]
  allEmpty: boolean
  availabilityMap: Map<string, AvailabilitySummary>
}

export function EmployeeList({ employees, allEmpty, availabilityMap }: EmployeeListProps) {
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleToggle(employee: Employee) {
    setLoadingId(employee.id)
    startTransition(async () => {
      await toggleEmployeeStatus(employee.id, !employee.active)
      setLoadingId(null)
    })
  }

  /* ── Estado vacío: nunca hay empleados ── */
  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0F4C5C]/10 to-[#0F4C5C]/5 dark:from-[#38BDF8]/10 dark:to-[#38BDF8]/5 flex items-center justify-center">
            <UserCircle2 className="w-10 h-10 text-[#0F4C5C]/30 dark:text-[#38BDF8]/30" />
          </div>
          {/* Decorative dots */}
          <span className="absolute top-1 right-0 w-3 h-3 rounded-full bg-[#0F4C5C]/20 dark:bg-[#38BDF8]/20" />
          <span className="absolute bottom-2 left-0 w-2 h-2 rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10" />
        </div>
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Sin empleados registrados
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          Tu equipo aparecerá aquí. Comienza creando el primer empleado.
        </p>
      </div>
    )
  }

  /* ── Estado vacío: búsqueda sin resultados ── */
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Ningún empleado coincide con la búsqueda
        </p>
      </div>
    )
  }

  return (
    <>
      <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-700/40">
        {employees.map((employee, index) => (
          <li
            key={employee.id}
            className="
              flex items-center gap-4 px-6 py-4
              hover:bg-slate-50/80 dark:hover:bg-slate-700/20
              transition-colors duration-150 group
            "
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {/* Avatar */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                text-sm font-bold transition-all duration-200
                ${employee.active
                  ? 'bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8]'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }
              `}
              aria-hidden="true"
            >
              {employee.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold truncate transition-colors duration-150 ${employee.active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 line-through decoration-1'}`}>
                  {employee.name}
                </p>
                
                {/* Availability Badge */}
                {(() => {
                  const avail = availabilityMap.get(employee.id)
                  if (!avail || avail.count === 0) {
                    return (
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800/40"
                        title="Sin disponibilidad configurada"
                      >
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Sin config.</span>
                      </span>
                    )
                  }
                  return (
                    <span 
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        avail.is_complete 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/40'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-600/40'
                      }`}
                      title={avail.day_labels.join(', ')}
                    >
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{avail.count}/7</span>
                    </span>
                  )
                })()}
              </div>
              {employee.phone ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  <span>{employee.phone}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5 italic">Sin teléfono</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Status badge */}
              <span
                className={`
                  text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2
                  ${employee.active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/40'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-600/40'
                  }
                `}
                aria-label={`Estado: ${employee.active ? 'Activo' : 'Inactivo'}`}
              >
                {employee.active ? 'Activo' : 'Inactivo'}
              </span>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setEditTarget(employee)}
                aria-label={`Editar empleado ${employee.name}`}
                className="
                  p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center
                  text-slate-300 dark:text-slate-600
                  hover:text-slate-600 dark:hover:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  opacity-0 group-hover:opacity-100
                  transition-all duration-150 cursor-pointer
                  focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/40
                "
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {/* Availability button */}
              <Link
                href={`/employees/${employee.id}/availability`}
                aria-label={`Configurar disponibilidad de ${employee.name}`}
                className="
                  p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center
                  text-slate-300 dark:text-slate-600
                  hover:text-[#0F4C5C] dark:hover:text-[#38BDF8]
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  opacity-0 group-hover:opacity-100
                  transition-all duration-150 cursor-pointer
                  focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/40
                "
              >
                <Clock className="w-3.5 h-3.5" />
              </Link>

              {/* Toggle button */}
              <button
                type="button"
                onClick={() => handleToggle(employee)}
                disabled={loadingId === employee.id}
                aria-label={employee.active ? `Desactivar a ${employee.name}` : `Activar a ${employee.name}`}
                aria-pressed={employee.active}
                className="
                  p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  transition-all duration-150 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/40
                "
              >
                {loadingId === employee.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : employee.active ? (
                  <ToggleRight className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit modal */}
      <EditEmployeeModal
        employee={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </>
  )
}
