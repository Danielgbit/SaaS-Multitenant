'use client'

import { Clock, CalendarOff } from 'lucide-react'
import { EmployeeScheduleCard } from './EmployeeScheduleCard'
import type { EmployeeWithSchedules } from '@/types/availability'

interface EmployeeSchedulesSectionProps {
  organizationId: string
  employees: EmployeeWithSchedules[]
}

export function EmployeeSchedulesSection({
  organizationId,
  employees,
}: EmployeeSchedulesSectionProps) {
  return (
    <section className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50">
          Horarios de Empleados
        </h2>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            No hay empleados registrados.
          </p>
          <a
            href="/employees"
            className="inline-flex items-center gap-2 mt-4 text-[#0F4C5C] dark:text-[#38BDF8] font-medium hover:underline"
          >
            Ir a empleados
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => (
            <EmployeeScheduleCard
              key={employee.id}
              employee={employee}
            />
          ))}
        </div>
      )}
    </section>
  )
}