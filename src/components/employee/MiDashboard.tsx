'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { MiProfileCard } from './MiProfileCard'
import { MiAgendaCard } from './MiAgendaCard'
import { MiServicesCard } from './MiServicesCard'
import { MiAvailabilityCard } from './MiAvailabilityCard'
import { MiPayrollLink } from './MiPayrollLink'
import type { EmployeeAvailability } from '@/types/availability'

interface Props {
  employee: Record<string, any>
  availability: EmployeeAvailability[]
  services: Record<string, any>[]
  appointments: Record<string, any>[]
}

export function MiDashboard({ employee, availability, services, appointments }: Props) {
  const colors = useThemeColors()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Mi espacio</h1>
          <p className="text-sm text-white/80 mt-1">Bienvenido, {employee.name}</p>
        </div>
      </div>

      {/* Grid: 2 cols desktop, 1 col mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <MiProfileCard employee={employee} />
          <MiAvailabilityCard employeeId={employee.id} initialAvailability={availability} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <MiAgendaCard appointments={appointments} />
          <MiServicesCard services={services} />
        </div>
      </div>

      {/* Bottom — full width */}
      <MiPayrollLink />
    </div>
  )
}
