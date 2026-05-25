'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateInsights } from '@/lib/insights'
import { getOverviewStats } from '@/actions/analytics/getOverviewStats'
import { getSystemAlerts } from '@/actions/analytics/getSystemAlerts'
import { getEmployeePerformance } from '@/actions/analytics/getEmployeePerformance'
import type { Period } from '@/types/analytics'

export async function getInsights(
  organizationId: string,
  period: Period
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    type: 'critical' | 'warning' | 'info' | 'success'
    title: string
    description: string
    metric?: string
    metricValue?: string
    action?: { label: string; href?: string }
    dismissible: boolean
    severity: number
    category: string
  }>
  error?: string
}> {
  const label = '[insights] getInsights'
  console.time(label)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const [overview, alerts, performance] = await Promise.all([
    getOverviewStats(organizationId, period),
    getSystemAlerts(organizationId),
    getEmployeePerformance(organizationId, period),
  ])

  const overviewData = overview.success ? overview.data : null
  const alertData = (alerts.success ? alerts.data : []) || []
  const perfData = (performance.success ? performance.data : []) || []

  const unconfirmedAlert = alertData.find(a => a.type === 'unconfirmed_appointment')
  const whatsappAlert = alertData.find(a => a.type === 'whatsapp_failed')

  const topEmployee = perfData.length > 0 ? perfData[0] : null

  const insights = evaluateInsights({
    appointments: overviewData?.appointments ?? 0,
    appointmentsChange: overviewData?.appointmentsChange ?? 0,
    revenue: overviewData?.revenue ?? 0,
    revenueChange: overviewData?.revenueChange ?? 0,
    clients: overviewData?.clients ?? 0,
    clientsChange: overviewData?.clientsChange ?? 0,
    completionRate: overviewData?.completionRate ?? 100,
    completionRateChange: overviewData?.completionRateChange ?? 0,
    avgTicket: overviewData?.avgTicket ?? 0,
    alerts: alertData.map(a => ({ type: a.type, count: a.count, severity: a.severity })),
    employeeCount: perfData.length,
    topEmployeeName: topEmployee?.employee_name,
    topEmployeeRevenue: topEmployee?.revenue,
    topEmployeeAppointments: topEmployee?.appointments,
    unconfirmedCount: unconfirmedAlert?.count ?? 0,
    whatsappFailedCount: whatsappAlert?.count ?? 0,
  })

  console.timeEnd(label)
  console.log(`${label} → ${insights.length} insights generated`)

  return { success: true, data: insights }
}
