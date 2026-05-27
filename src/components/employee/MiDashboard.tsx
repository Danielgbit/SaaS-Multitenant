'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { MiProfileCard } from './MiProfileCard'
import { MiAgendaCard } from './MiAgendaCard'
import { MiServicesCard } from './MiServicesCard'
import { MiAvailabilityCard } from './MiAvailabilityCard'
import { MiPayrollLink } from './MiPayrollLink'
import { MiMetricsCards } from './MiMetricsCards'
import { MiHistoryCard } from './MiHistoryCard'
import type { EmployeeAvailability } from '@/types/availability'
import type { EmployeeMetrics, ServiceHistory, UpcomingAppointment } from '@/types/employee-metrics'
import type { Database } from '@/../types/supabase'

type Employee = Database['public']['Tables']['employees']['Row']
type Service = Database['public']['Tables']['services']['Row']

interface Props {
  employee: Employee
  availability: EmployeeAvailability[]
  services: Service[]
  appointments: UpcomingAppointment[]
  metrics: EmployeeMetrics
  history: ServiceHistory[]
}

export function MiDashboard({ employee, availability, services, appointments, metrics, history }: Props) {
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

      {/* Metrics row — full width */}
      <MiMetricsCards metrics={metrics} />

      {/* Grid: 2 cols desktop, 1 col mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <MiProfileCard employee={employee as any} />
          <MiAvailabilityCard employeeId={employee.id} initialAvailability={availability} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <MiHistoryCard history={history} />
          <MiServicesCard services={services as any} />
        </div>
      </div>

      {/* Bottom — full width */}
      <MiAgendaCard appointments={appointments} />
      <MiPayrollLink />
    </div>
  )
}
