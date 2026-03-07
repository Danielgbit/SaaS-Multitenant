'use client'

import { useState, useTransition } from 'react'
import { Pencil, ToggleLeft, ToggleRight, Loader2, Scissors, Clock, DollarSign } from 'lucide-react'
import { toggleServiceStatus } from '@/actions/services/toggleServiceStatus'
import { EditServiceModal } from './EditServiceModal'
import type { Service } from '@/types/services'

interface ServiceListProps {
  services: Service[]
  allEmpty: boolean
}

export function ServiceList({ services, allEmpty }: ServiceListProps) {
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleToggle(service: Service) {
    setLoadingId(service.id)
    startTransition(async () => {
      await toggleServiceStatus(service.id, !service.active)
      setLoadingId(null)
    })
  }

  /* ── Estado vacío: nunca hay servicios ── */
  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0F4C5C]/10 to-[#0F4C5C]/5 dark:from-[#38BDF8]/10 dark:to-[#38BDF8]/5 flex items-center justify-center">
            <Scissors className="w-10 h-10 text-[#0F4C5C]/30 dark:text-[#38BDF8]/30" />
          </div>
          <span className="absolute top-1 right-0 w-3 h-3 rounded-full bg-[#0F4C5C]/20 dark:bg-[#38BDF8]/20" />
          <span className="absolute bottom-2 left-0 w-2 h-2 rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10" />
        </div>
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Sin catálogo de servicios
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          Los servicios que ofreces aparecerán aquí. Comienza creando el primero para usarlos en el calendario.
        </p>
      </div>
    )
  }

  /* ── Estado vacío: búsqueda sin resultados ── */
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Ningún servicio coincide con la búsqueda
        </p>
      </div>
    )
  }

  return (
    <>
      <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-700/40">
        {services.map((service, index) => (
          <li
            key={service.id}
            className="
              flex items-center gap-4 px-6 py-4
              hover:bg-slate-50/80 dark:hover:bg-slate-700/20
              transition-colors duration-150 group
            "
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {/* Avatar / Icon */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                transition-all duration-200
                ${service.active
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }
              `}
              aria-hidden="true"
            >
              <Scissors className="w-5 h-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
              <div className="flex-1">
                <p className={`text-sm font-semibold truncate transition-colors duration-150 ${service.active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 line-through decoration-1'}`}>
                  {service.name}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span>{service.duration} min</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-4">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      ${service.price.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`
                  hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2
                  ${service.active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/40'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-600/40'
                  }
                `}
                aria-label={`Estado: ${service.active ? 'Activo' : 'Inactivo'}`}
              >
                {service.active ? 'Activo' : 'Inactivo'}
              </span>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setEditTarget(service)}
                aria-label={`Editar servicio ${service.name}`}
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

              {/* Toggle button */}
              <button
                type="button"
                onClick={() => handleToggle(service)}
                disabled={loadingId === service.id}
                aria-label={service.active ? `Desactivar ${service.name}` : `Activar ${service.name}`}
                aria-pressed={service.active}
                className="
                  p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  transition-all duration-150 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/40
                "
              >
                {loadingId === service.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : service.active ? (
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
      <EditServiceModal
        service={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </>
  )
}
