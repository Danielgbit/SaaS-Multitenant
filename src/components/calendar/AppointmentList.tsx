'use client'

import React from 'react'
import type { AppointmentWithDetails, CalendarColors } from '@/types/calendar'
import { AppointmentCardV2 } from './AppointmentCardV2'
import { AppointmentClusterCard } from './AppointmentClusterCard'
import { useAppointmentClusters } from '@/hooks/useAppointmentClusters'

interface AppointmentListProps {
  appointments: AppointmentWithDetails[]
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>
  formatTime: (dateString: string) => string
  onAppointmentClick: (apt: AppointmentWithDetails) => void
  showEmployeeDot?: boolean
  employeeColors: Record<string, string>
  isAllEmployees: boolean
}

export function AppointmentList({
  appointments,
  COLORS,
  STATUS_CONFIG,
  formatTime,
  onAppointmentClick,
  showEmployeeDot = false,
  employeeColors,
  isAllEmployees
}: AppointmentListProps) {
  const { renderAppointments } = useAppointmentClusters(appointments, isAllEmployees)

  const renderCard = (apt: AppointmentWithDetails, index: number) => (
    <AppointmentCardV2
      key={apt.id}
      apt={apt}
      COLORS={COLORS}
      STATUS_CONFIG={STATUS_CONFIG}
      formatTime={formatTime}
      onClick={() => onAppointmentClick(apt)}
      showEmployeeDot={showEmployeeDot}
      employeeColors={employeeColors}
    />
  )

  const renderCluster = (cluster: import('@/hooks/useAppointmentClusters').ClusterGroup, index: number) => (
    <AppointmentClusterCard
      key={`cluster-${cluster.timeKey}-${index}`}
      cluster={cluster}
      COLORS={COLORS}
      STATUS_CONFIG={STATUS_CONFIG}
      formatTime={formatTime}
      onAppointmentClick={onAppointmentClick}
      employeeColors={employeeColors}
    />
  )

  const [collapsed, setCollapsed] = React.useState(true)

  return (
    <div className={`space-y-1 md:space-y-3 ${collapsed ? 'max-h-[200px] overflow-y-auto overscroll-contain' : ''} md:max-h-none md:overflow-visible`}>
      {renderAppointments(renderCard, renderCluster)}
      {collapsed && appointments.length > 3 && (
        <div className="md:hidden text-center pt-1">
          <button
            onClick={() => setCollapsed(false)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            style={{ color: COLORS.primary }}
          >
            +{appointments.length - 3} más
          </button>
        </div>
      )}
    </div>
  )
}