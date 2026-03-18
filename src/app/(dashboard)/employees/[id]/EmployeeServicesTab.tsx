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
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
          <Scissors className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Servicios disponibles
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {enabledCount} de {allServices.length} servicios activados
          </p>
        </div>
      </div>

      {allServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            No hay servicios disponibles. Crea servicios primero.
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
                    ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' 
                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50'
                  }
                `}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleService(service.id, !isEnabled)}
                      disabled={isPending}
                      className={`
                        w-6 h-6 rounded-md flex items-center justify-center
                        transition-all duration-200
                        ${isEnabled 
                          ? 'bg-[#0F4C5C] dark:bg-[#38BDF8]' 
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-[#0F4C5C] dark:hover:border-[#38BDF8]'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {isEnabled && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <p className={`font-medium ${isEnabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
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
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Override Fields */}
                {isEnabled && isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                      Personalizar para este empleado
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400">Duración (min)</label>
                        <input
                          type="number"
                          min="0"
                          defaultValue={employeeService?.duration_override || service.duration}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || service.duration
                            handleUpdateOverrides(service.id, val, employeeService?.price_override || null)
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
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
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
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
