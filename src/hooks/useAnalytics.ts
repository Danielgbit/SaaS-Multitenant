'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDashboardData } from '@/actions/analytics/getDashboardData'
import { getUpcomingAppointments } from '@/actions/analytics/getUpcomingAppointments'
import { getRecentActivity } from '@/actions/analytics/getRecentActivity'
import { getEmployeePerformance } from '@/actions/analytics/getEmployeePerformance'
import { getSystemAlerts } from '@/actions/analytics/getSystemAlerts'
import { getPayrollSummary } from '@/actions/payroll/getPayrollSummary'

export type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

export interface DashboardOverview {
  appointments: number
  appointmentsChange: number
  revenue: number
  revenueChange: number
  clients: number
  clientsChange: number
  completionRate: number
  completionRateChange: number
  avgTicket: number
}

export interface TrendData {
  date: string
  label: string
  appointments: number
  completed: number
  revenue: number
}

export interface TopService {
  serviceId: string
  serviceName: string
  count: number
  percentage: number
  revenue: number
}

export interface UpcomingAppointment {
  id: string
  start_time: string
  status: string
  client_name: string
  client_phone: string | null
  service_name: string | null
  employee_name: string | null
  employee_id: string | null
}

export interface Activity {
  id: string
  type: 'appointment_created' | 'appointment_completed' | 'appointment_cancelled' | 'client_registered'
  title: string
  description: string
  timestamp: string
}

export interface EmployeeData {
  employee_id: string
  employee_name: string
  appointments: number
  revenue: number
  completed: number
}

export interface Alert {
  id: string
  type: 'whatsapp_failed' | 'unconfirmed_appointment' | 'info'
  severity: 'warning' | 'info' | 'success'
  title: string
  description: string
  link?: string
  linkLabel?: string
  count: number
}

export interface PayrollSummary {
  employeeCount: number
  employeesWithCommission: number
  pendingCommissionsTotal: number
  pendingLoansTotal: number
}

export interface AnalyticsData {
  overview: DashboardOverview
  trend: TrendData[]
  topServices: TopService[]
  upcomingAppointments: UpcomingAppointment[]
  recentActivity: Activity[]
  employeePerformance: EmployeeData[]
  alerts: Alert[]
  payrollSummary: PayrollSummary
}

interface UseAnalyticsOptions {
  organizationId: string
  period: Period
  skipPayroll?: boolean
}

export function useAnalytics({ organizationId, period, skipPayroll = true }: UseAnalyticsOptions) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [
      dashboardResult,
      appointmentsResult,
      activityResult,
      employeeResult,
      alertsResult,
      payrollResult
    ] = await Promise.all([
      getDashboardData(organizationId, period),
      getUpcomingAppointments(organizationId, 5),
      getRecentActivity(organizationId, 8),
      getEmployeePerformance(organizationId, period),
      getSystemAlerts(organizationId),
      skipPayroll ? Promise.resolve({ success: true, data: null }) : getPayrollSummary(organizationId)
    ])

    if (!dashboardResult.success) {
      setError(dashboardResult.error || 'Error loading dashboard data')
      setLoading(false)
      return
    }

    setData({
      overview: dashboardResult.data!.overview,
      trend: dashboardResult.data!.trend,
      topServices: dashboardResult.data!.topServices,
      upcomingAppointments: appointmentsResult.data || [],
      recentActivity: activityResult.data || [],
      employeePerformance: employeeResult.data || [],
      alerts: alertsResult.data || [],
      payrollSummary: payrollResult.data ? {
        employeeCount: payrollResult.data.employeeCount,
        employeesWithCommission: payrollResult.data.employeesWithCommission,
        pendingCommissionsTotal: payrollResult.data.pendingCommissionsTotal,
        pendingLoansTotal: payrollResult.data.pendingLoansTotal
      } : {
        employeeCount: 0,
        employeesWithCommission: 0,
        pendingCommissionsTotal: 0,
        pendingLoansTotal: 0
      }
    })
    setLoading(false)
  }, [organizationId, period, skipPayroll])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    loading,
    data,
    error,
    refetch: loadData
  }
}