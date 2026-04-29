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

  return (
    <div className="space-y-3">
      {renderAppointments(renderCard, renderCluster)}
    </div>
  )
}