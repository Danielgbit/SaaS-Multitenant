'use client'

import { useState, useTransition } from 'react'
import { User, Phone, Save, Loader2, Check } from 'lucide-react'
import { updateEmployee } from '@/actions/employees/updateEmployee'
import { toggleEmployeeStatus } from '@/actions/employees/toggleEmployeeStatus'
import type { Employee } from '@/types/employees'

interface EmployeeInfoTabProps {
  employee: Employee
  organizationId: string
}

export function EmployeeInfoTab({ employee, organizationId }: EmployeeInfoTabProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(employee.name)
  const [phone, setPhone] = useState(employee.phone || '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setError(null)
    setSaved(false)
    
    startTransition(async () => {
      const result = await updateEmployee({
        id: employee.id,
        name,
        phone: phone || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  function handleToggleActive() {
    startTransition(async () => {
      await toggleEmployeeStatus(employee.id, !employee.active)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
          <User className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Información personal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Datos básicos del empleado
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label 
            htmlFor="employee-name" 
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Nombre completo
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              id="employee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full pl-12 pr-4 py-3 rounded-xl
                border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900
                text-slate-900 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label 
            htmlFor="employee-phone" 
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Teléfono
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              id="employee-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 11 1234 5678"
              className="
                w-full pl-12 pr-4 py-3 rounded-xl
                border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900
                text-slate-900 dark:text-slate-100
                placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]
                transition-all duration-200
              "
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Estado del empleado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {employee.active ? 'El empleado está activo' : 'El empleado está inactivo'}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className={`
              px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
              ${employee.active 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {employee.active ? 'Activo' : 'Inactivo'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="
            flex items-center gap-2 px-6 py-3 rounded-xl
            bg-[#0F4C5C] hover:bg-[#0C3E4A] active:scale-[0.98]
            text-white font-semibold
            shadow-lg shadow-[#0F4C5C]/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  )
}
