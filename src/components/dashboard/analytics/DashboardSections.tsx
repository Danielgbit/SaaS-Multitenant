'use client'

import { useServerAction } from '@/lib/use-server-action'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getOverviewStats } from '@/actions/analytics/getOverviewStats'
import { getAppointmentsTrend } from '@/actions/analytics/getAppointmentsTrend'
import { getTopServices } from '@/actions/analytics/getTopServices'
import { getUpcomingAppointments } from '@/actions/analytics/getUpcomingAppointments'
import { getRecentActivity } from '@/actions/analytics/getRecentActivity'
import { getEmployeePerformance } from '@/actions/analytics/getEmployeePerformance'
import { getSystemAlerts } from '@/actions/analytics/getSystemAlerts'
import { getPayrollSummary } from '@/actions/payroll/getPayrollSummary'
import { StatsCard } from './StatsCard'
import { TrendChart } from './TrendChart'
import { RecentActivity } from './RecentActivity'
import { UpcomingAppointments } from './UpcomingAppointments'
import { EmployeePerformance } from './EmployeePerformance'
import { PayrollSummaryWidget } from './PayrollSummaryWidget'
import { AlertsPanel } from './AlertsPanel'
import { TopServicesList } from './TopServicesList'
import { StatsGridSkeleton, ChartSectionSkeleton, SidebarSectionSkeleton, TableSkeleton } from './DashboardSkeletons'
import type { Period } from './types'

function ErrorState({ error }: { error: Error }) {
  const COLORS = useThemeColors()
  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.error, backgroundColor: COLORS.errorLight }}>
      <p className="text-sm font-medium" style={{ color: COLORS.error }}>
        Error al cargar los datos
      </p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
        {error.message}
      </p>
    </div>
  )
}

export function OverviewStatsGrid({ orgId, period }: { orgId: string; period: Period }) {
  const { data, loading, error } = useServerAction(
    () => getOverviewStats(orgId, period),
    [orgId, period]
  )

  if (loading && !data) return <StatsGridSkeleton />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  const result = data.data
  const statsCards = [
    { title: 'Citas', value: result.appointments, change: result.appointmentsChange },
    { title: 'Ingresos', value: result.revenue, change: result.revenueChange },
    { title: 'Nuevos Clientes', value: result.clients, change: result.clientsChange },
    { title: 'Ticket Promedio', value: result.avgTicket, change: result.appointmentsChange },
    { title: 'Finalizadas', value: result.completionRate, suffix: '%', change: result.completionRateChange },
  ]

  const total = result.appointments
  const completed = result.completionRate && total
    ? Math.round((result.completionRate / 100) * total) : 0
  const cancelled = total > 0 ? Math.round(((total - completed) / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsCards.map(s => (
        <StatsCard key={s.title} {...s} value={s.value} loading={false} />
      ))}
      <StatsCard title="Canceladas" value={cancelled} suffix="%" loading={false} />
    </div>
  )
}

export function TrendChartSection({ orgId, period }: { orgId: string; period: Period }) {
  const days = period === 'year' ? 90 : period === 'month' ? 30 : period === 'week' ? 14 : 7
  const { data, loading, error } = useServerAction(
    () => getAppointmentsTrend(orgId, days),
    [orgId, days]
  )

  if (loading && !data) return <ChartSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <TrendChart data={data.data} loading={false} />
}

export function RecentActivitySection({ orgId }: { orgId: string }) {
  const { data, loading, error } = useServerAction(
    () => getRecentActivity(orgId, 8),
    [orgId]
  )

  if (loading && !data) return <SidebarSectionSkeleton height="h-36" />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <RecentActivity activities={data.data} loading={false} />
}

export function UpcomingSection({ orgId }: { orgId: string }) {
  const { data, loading, error } = useServerAction(
    () => getUpcomingAppointments(orgId, 5),
    [orgId]
  )

  if (loading && !data) return <SidebarSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <UpcomingAppointments appointments={data.data} loading={false} />
}

export function EmployeePerformanceSection({ orgId, period }: { orgId: string; period: Period }) {
  const { data, loading, error } = useServerAction(
    () => getEmployeePerformance(orgId, period),
    [orgId, period]
  )

  if (loading && !data) return <SidebarSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <EmployeePerformance employees={data.data} loading={false} />
}

export function PayrollSummarySection({ orgId }: { orgId: string }) {
  const { data, loading, error } = useServerAction(
    () => getPayrollSummary(orgId),
    [orgId]
  )

  if (loading && !data) return <SidebarSectionSkeleton height="h-32" />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <PayrollSummaryWidget summary={data.data} loading={false} />
}

export function AlertsSection({ orgId }: { orgId: string }) {
  const { data, loading, error } = useServerAction(
    () => getSystemAlerts(orgId),
    [orgId]
  )

  if (loading && !data) return <SidebarSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <AlertsPanel alerts={data.data} loading={false} />
}

export function TopServicesSection({ orgId, period }: { orgId: string; period: Period }) {
  const days = period === 'year' ? 365 : period === 'month' ? 30 : 7
  const { data, loading, error } = useServerAction(
    () => getTopServices(orgId, 5, days),
    [orgId, days]
  )

  if (loading && !data) return <TableSkeleton rows={3} />
  if (error) return <ErrorState error={error} />
  if (data?.success === false) return <ErrorState error={new Error(data.error || 'Error al cargar')} />
  if (!data?.data) return null

  return <TopServicesList services={data.data} loading={false} />
}
