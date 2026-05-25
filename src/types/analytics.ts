import type { ReactNode } from 'react'

// ── Period ──

export type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

// ── Data Models (lo que devuelven los server actions) ──

export interface OverviewStats {
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

export interface TrendDataPoint {
  date: string
  label: string
  appointments: number
  completed: number
  revenue: number
}

export interface TopServiceItem {
  serviceId: string
  serviceName: string
  count: number
  percentage: number
  revenue: number
}

export interface ActivityItem {
  id: string
  type: 'appointment_created' | 'appointment_completed' | 'appointment_cancelled' | 'client_registered'
  title: string
  description: string
  timestamp: string
}

export interface UpcomingAppointment {
  id: string
  start_time: string
  status: string
  client_name: string
  client_phone: string | null
  service_name: string | null
  employee_name: string | null
}

export interface EmployeeData {
  employee_id: string
  employee_name: string
  appointments: number
  revenue: number
  completed: number
}

export interface PayrollSummary {
  employeeCount: number
  employeesWithCommission: number
  pendingCommissionsTotal: number
  pendingLoansTotal: number
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

// ── Component Props ──

export interface StatsCardProps {
  title: string
  value: number
  change?: number
  prefix?: string
  suffix?: string
  icon?: ReactNode
  iconColor?: string
  sparkline?: number[]
}

export interface TrendChartProps {
  data?: TrendDataPoint[]
}

export interface TopServicesListProps {
  services: TopServiceItem[]
}

export interface RecentActivityProps {
  activities: ActivityItem[]
}

export interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[]
}

export interface EmployeePerformanceProps {
  employees: EmployeeData[]
}

export interface PayrollSummaryWidgetProps {
  summary: PayrollSummary | undefined
}

export interface AlertsPanelProps {
  alerts: Alert[]
}

export interface MetricCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  icon?: ReactNode
  iconColor?: string
  change?: number
  trendLabel?: string
  sparkline?: number[]
  onClick?: () => void
  footer?: ReactNode
  className?: string
}
