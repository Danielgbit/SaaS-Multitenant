export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface Insight {
  id: string
  type: InsightSeverity
  title: string
  description: string
  metric?: string
  metricValue?: string
  action?: { label: string; href?: string }
  dismissible: boolean
  severity: number
  category: 'revenue' | 'operations' | 'staff' | 'alerts' | 'clients'
}

export interface InsightContext {
  appointments: number
  appointmentsChange: number
  revenue: number
  revenueChange: number
  clients: number
  clientsChange: number
  completionRate: number
  completionRateChange: number
  avgTicket: number
  alerts: Array<{ type: string; count: number; severity: string }>
  employeeCount: number
  topEmployeeName?: string
  topEmployeeRevenue?: number
  topEmployeeAppointments?: number
  unconfirmedCount: number
  whatsappFailedCount: number
}

export interface InsightRule {
  id: string
  evaluate: (ctx: InsightContext) => Insight | null
}
