'use client'

import { useMemo, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type {
  AppointmentWithDetails,
  Employee,
  EmployeeFilter,
  EmployeeWorkload,
  EmployeeWithWorkload,
  CalendarColors,
  WorkloadLevel
} from '@/types/calendar'

const STORAGE_KEY_PREFIX = 'calendar_filter_'

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWorkloadLevel(count: number): WorkloadLevel {
  if (count <= 5) return 'low'
  if (count <= 10) return 'normal'
  if (count <= 15) return 'busy'
  return 'overloaded'
}

function calculateWorkload(
  appointments: AppointmentWithDetails[],
  employeeId: string
): EmployeeWorkload {
  const employeeApts = appointments.filter(apt => apt.employee_id === employeeId)

  const byDay: Record<string, number> = {}
  employeeApts.forEach(apt => {
    const key = formatDateKey(new Date(apt.start_time))
    byDay[key] = (byDay[key] || 0) + 1
  })

  const dailyBreakdown = byDay
  const weeklyCount = employeeApts.length
  const maxPerDay = Math.max(0, ...Object.values(byDay))

  return {
    employeeId,
    weeklyCount,
    maxPerDay,
    workloadLevel: getWorkloadLevel(maxPerDay)
  }
}

function calculateAllWorkloads(
  appointments: AppointmentWithDetails[],
  employees: Employee[]
): Record<string, EmployeeWorkload> {
  const workloads: Record<string, EmployeeWorkload> = {}

  employees.forEach(emp => {
    workloads[emp.id] = calculateWorkload(appointments, emp.id)
  })

  return workloads
}

function employeesWithWorkload(
  employees: Employee[],
  appointments: AppointmentWithDetails[],
  workloads: Record<string, EmployeeWorkload>
): EmployeeWithWorkload[] {
  return employees.map(emp => {
    const wl = workloads[emp.id] || {
      employeeId: emp.id,
      weeklyCount: 0,
      maxPerDay: 0,
      workloadLevel: 'low' as WorkloadLevel
    }

    const employeeApts = appointments.filter(apt => apt.employee_id === emp.id)
    const byDay: Record<string, number> = {}
    employeeApts.forEach(apt => {
      const key = formatDateKey(new Date(apt.start_time))
      byDay[key] = (byDay[key] || 0) + 1
    })

    return {
      ...emp,
      weeklyCount: wl.weeklyCount,
      maxPerDay: wl.maxPerDay,
      workloadLevel: wl.workloadLevel,
      dailyBreakdown: byDay
    }
  })
}

interface UseCalendarFiltersProps {
  organizationId: string
  userRole: string
  employees: Employee[]
  appointments: AppointmentWithDetails[]
}

interface UseCalendarFiltersReturn {
  selectedEmployeeId: EmployeeFilter
  setSelectedEmployeeId: (id: EmployeeFilter) => void
  filteredAppointments: AppointmentWithDetails[]
  employeesWithLoad: EmployeeWithWorkload[]
  totalAppointments: number
  visibleAppointmentsCount: number
  employeeWorkloads: Record<string, EmployeeWorkload>
  getDefaultFilter: () => EmployeeFilter
}

export function useCalendarFilters({
  organizationId,
  userRole,
  employees,
  appointments
}: UseCalendarFiltersProps): UseCalendarFiltersReturn {
  const storageKey = `${STORAGE_KEY_PREFIX}${organizationId}`

  const getDefaultFilter = useCallback((): EmployeeFilter => {
    if (userRole === 'empleado' && employees.length > 0) {
      return employees[0]?.id || 'all'
    }
    return 'all'
  }, [userRole, employees])

  const [selectedEmployeeId, setSelectedEmployeeId] = useLocalStorage<EmployeeFilter>(
    storageKey,
    getDefaultFilter()
  )

  const employeeWorkloads = useMemo(
    () => calculateAllWorkloads(appointments, employees),
    [appointments, employees]
  )

  const employeesWithLoad = useMemo(
    () => employeesWithWorkload(employees, appointments, employeeWorkloads),
    [employees, appointments, employeeWorkloads]
  )

  const filteredAppointments = useMemo(() => {
    if (selectedEmployeeId === 'all') {
      return appointments
    }
    return appointments.filter(apt => apt.employee_id === selectedEmployeeId)
  }, [appointments, selectedEmployeeId])

  const totalAppointments = appointments.length
  const visibleAppointmentsCount = filteredAppointments.length

  return {
    selectedEmployeeId,
    setSelectedEmployeeId,
    filteredAppointments,
    employeesWithLoad,
    totalAppointments,
    visibleAppointmentsCount,
    employeeWorkloads,
    getDefaultFilter
  }
}
