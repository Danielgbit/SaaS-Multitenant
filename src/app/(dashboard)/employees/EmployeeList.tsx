'use client'

import { UserCircle2, Search, Plus } from 'lucide-react'
import { EmployeeCard } from '@/components/employees/EmployeeCard'
import type { Employee } from '@/types/employees'
import type { AvailabilitySummary } from '@/services/availability/getAvailability'
import type { Invitation } from '@/types/invitations'
import type { EmployeeServicesMap } from '@/services/employees/getEmployeeServicesForOrganization'

interface EmployeeListProps {
  employees: Employee[]
  allEmpty: boolean
  availabilityMap: Record<string, AvailabilitySummary>
  invitationMap: Record<string, Invitation>
  employeeServicesMap: EmployeeServicesMap
  organizationId: string
  userRole: string
  onInvite: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onHardDelete: (employee: Employee) => void
  onShowInvitationLink: (employee: Employee, invitation: Invitation) => void
  onResendInvite: (invitationId: string) => void
}

export function EmployeeList({
  employees,
  allEmpty,
  availabilityMap,
  invitationMap,
  employeeServicesMap,
  organizationId,
  userRole,
  onInvite,
  onDelete,
  onHardDelete,
  onShowInvitationLink,
  onResendInvite,
}: EmployeeListProps) {
  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0F4C5C]/10 to-[#38BDF8]/10 dark:from-[#38BDF8]/10 dark:to-[#0F4C5C]/5 flex items-center justify-center shadow-lg shadow-[#0F4C5C]/10 dark:shadow-none">
            <UserCircle2 className="w-12 h-12 text-[#0F4C5C]/30 dark:text-[#38BDF8]/50" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center shadow-md">
            <Plus className="w-3 h-3 text-[#0F4C5C]/40 dark:text-[#38BDF8]/40" />
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Sin empleados registrados
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          Tu equipo aparecerá aquí. Comienza creando el primer empleado para gestionar tu negocio.
        </p>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 shadow-lg">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Ningún empleado coincide con tu búsqueda
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Intenta con otros términos o limpia los filtros
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {employees.map((employee, index) => {
          const invitation = invitationMap[employee.id]

          return (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              availability={availabilityMap[employee.id]}
              services={employeeServicesMap[employee.id] || []}
              invitation={invitation}
              organizationId={organizationId}
              userRole={userRole}
              onInvite={onInvite}
              onDelete={onDelete}
              onHardDelete={onHardDelete}
              onShowInvitationLink={onShowInvitationLink}
              onResendInvite={onResendInvite}
              animationDelay={index * 50}
            />
          )
        })}
      </div>
    </div>
  )
}