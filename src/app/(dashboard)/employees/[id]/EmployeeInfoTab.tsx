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
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-[#0F4C5C]/25">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Información personal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Datos básicos del empleado
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label 
            htmlFor="employee-name" 
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Nombre completo
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors duration-200">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              id="employee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full pl-14 pr-4 py-3.5 rounded-xl
                bg-white/80 dark:bg-slate-800/60
                border border-slate-200/60 dark:border-slate-700/60
                text-slate-900 dark:text-slate-100
                placeholder-slate-400
                shadow-md shadow-slate-200/20 dark:shadow-none
                focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 dark:focus:ring-[#38BDF8]/30
                focus:border-[#0F4C5C]/50 dark:focus:border-[#38BDF8]/50
                focus:shadow-xl focus:shadow-[#0F4C5C]/10
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label 
            htmlFor="employee-phone" 
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Teléfono
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors duration-200">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              id="employee-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 11 1234 5678"
              className="
                w-full pl-14 pr-4 py-3.5 rounded-xl
                bg-white/80 dark:bg-slate-800/60
                border border-slate-200/60 dark:border-slate-700/60
                text-slate-900 dark:text-slate-100
                placeholder-slate-400
                shadow-md shadow-slate-200/20 dark:shadow-none
                focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 dark:focus:ring-[#38BDF8]/30
                focus:border-[#0F4C5C]/50 dark:focus:border-[#38BDF8]/50
                focus:shadow-xl focus:shadow-[#0F4C5C]/10
                transition-all duration-200
              "
            />
          </div>
        </div>
      </div>

      {/* Status Toggle */}
      <div className="
        pt-6 border-t border-slate-100/60 dark:border-slate-700/40
        flex items-center justify-between
        p-4 rounded-xl
        bg-slate-50/50 dark:bg-slate-800/30
      ">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Estado del empleado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {employee.active ? 'El empleado está activo y visible en el calendario' : 'El empleado está inactivo'}
          </p>
        </div>
        <button
          onClick={handleToggleActive}
          disabled={isPending}
          className={`
            relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
            ${employee.active 
              ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/50' 
              : 'bg-slate-200/80 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-600/50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-md shadow-slate-200/20 dark:shadow-none
          `}
        >
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${employee.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {employee.active ? 'Activo' : 'Inactivo'}
          </span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="
            group relative flex items-center gap-2 px-8 py-3.5 rounded-xl
            bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4d] hover:from-[#0C3E4A] hover:to-[#083242] active:scale-[0.98]
            text-white font-semibold
            shadow-xl shadow-[#0F4C5C]/25 hover:shadow-2xl hover:shadow-[#0F4C5C]/30
            transition-all duration-300 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
          "
        >
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin relative" />
              <span className="relative">Guardando...</span>
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5 relative" />
              <span className="relative">Guardado</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5 relative" />
              <span className="relative">Guardar cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
