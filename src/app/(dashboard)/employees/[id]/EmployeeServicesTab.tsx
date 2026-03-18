'use client'

import { useState, useTransition } from 'react'
import { Scissors, Clock, DollarSign, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { updateEmployeeService } from '@/actions/employees/updateEmployeeService'
import type { Service } from '@/types/services'
import type { EmployeeService } from '@/services/employees/getEmployeeServices'

interface EmployeeServicesTabProps {
  employeeId: string
  allServices: Service[]
  employeeServices: EmployeeService[]
}

export function EmployeeServicesTab({ 
  employeeId, 
  allServices, 
  employeeServices: initialEmployeeServices 
}: EmployeeServicesTabProps) {
  const [isPending, startTransition] = useTransition()
  const [employeeServices, setEmployeeServices] = useState(initialEmployeeServices)
  const [expandedService, setExpandedService] = useState<string | null>(null)
  
  const enabledServiceIds = new Set(employeeServices.map(es => es.service_id))

  function handleToggleService(serviceId: string, enabled: boolean) {
    startTransition(async () => {
      await updateEmployeeService({
        employeeId,
        serviceId,
        enabled,
      })
      
      if (enabled) {
        const service = allServices.find(s => s.id === serviceId)
        setEmployeeServices([...employeeServices, {
          id: `temp-${serviceId}`,
          employee_id: employeeId,
          service_id: serviceId,
          duration_override: null,
          price_override: null,
          service: service,
        }])
      } else {
        setEmployeeServices(employeeServices.filter(es => es.service_id !== serviceId))
      }
    })
  }

  function handleUpdateOverrides(serviceId: string, durationOverride: number | null, priceOverride: number | null) {
    startTransition(async () => {
      await updateEmployeeService({
        employeeId,
        serviceId,
        enabled: true,
        durationOverride: durationOverride || undefined,
        priceOverride: priceOverride || undefined,
      })

      setEmployeeServices(employeeServices.map(es => 
        es.service_id === serviceId 
          ? { ...es, duration_override: durationOverride, price_override: priceOverride }
          : es
      ))
    })
  }

  const enabledCount = employeeServices.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-[#0F4C5C]/25">
          <Scissors className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Servicios disponibles
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {enabledCount} de {allServices.length} servicios activados
          </p>
        </div>
      </div>

      {allServices.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
            No hay servicios disponibles
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Crea servicios primero en la sección de servicios
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {allServices.map((service) => {
            const isEnabled = enabledServiceIds.has(service.id)
            const employeeService = employeeServices.find(es => es.service_id === service.id)
            const isExpanded = expandedService === service.id

            return (
              <li
                key={service.id}
                className={`
                  rounded-xl border transition-all duration-200
                  ${isEnabled 
                    ? 'bg-white/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/40 hover:shadow-lg' 
                    : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100/50 dark:border-slate-700/20'
                  }
                `}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleService(service.id, !isEnabled)}
                      disabled={isPending}
                      className={`
                        w-6 h-6 rounded-lg flex items-center justify-center
                        transition-all duration-200
                        ${isEnabled 
                          ? 'bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9]' 
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8]'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {isEnabled && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <p className={`font-semibold ${isEnabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {service.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${service.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isEnabled && (
                    <button
                      onClick={() => setExpandedService(isExpanded ? null : service.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Override Fields */}
                {isEnabled && isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100/60 dark:border-slate-700/40">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                      Personalizar para este empleado
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-600 dark:text-slate-400">Duración (min)</label>
                        <input
                          type="number"
                          min="0"
                          defaultValue={employeeService?.duration_override || service.duration}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || service.duration
                            handleUpdateOverrides(service.id, val, employeeService?.price_override || null)
                          }}
                          className="
                            w-full px-3 py-2 rounded-lg 
                            bg-white/80 dark:bg-slate-800/60
                            border border-slate-200/50 dark:border-slate-700/50
                            text-sm shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30
                          "
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-600 dark:text-slate-400">Precio ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={employeeService?.price_override || service.price}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || service.price
                            handleUpdateOverrides(service.id, employeeService?.duration_override || null, val)
                          }}
                          className="
                            w-full px-3 py-2 rounded-lg 
                            bg-white/80 dark:bg-slate-800/60
                            border border-slate-200/50 dark:border-slate-700/50
                            text-sm shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30
                          "
                        />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
