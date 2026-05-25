'use client'

import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { useThemeColors } from '@/hooks/useThemeColors'
import { dashboardKeys } from '@/lib/query-keys'
import { flags } from '@/lib/flags'
import { getOverviewStats } from '@/actions/analytics/getOverviewStats'
import { getAppointmentsTrend } from '@/actions/analytics/getAppointmentsTrend'
import { getTopServices } from '@/actions/analytics/getTopServices'
import { getUpcomingAppointments } from '@/actions/analytics/getUpcomingAppointments'
import { getRecentActivity } from '@/actions/analytics/getRecentActivity'
import { getEmployeePerformance } from '@/actions/analytics/getEmployeePerformance'
import { getSystemAlerts } from '@/actions/analytics/getSystemAlerts'
import { getPayrollSummary } from '@/actions/payroll/getPayrollSummary'
import { getTodayPulse } from '@/actions/analytics/getTodayPulse'
import { getStaffUtilization } from '@/actions/analytics/getStaffUtilization'
import { MetricCard } from '@/components/ui/MetricCard'
import { TrendChart } from './TrendChart'
import { RecentActivity } from './RecentActivity'
import { UpcomingAppointments } from './UpcomingAppointments'
import { EmployeePerformance } from './EmployeePerformance'
import { PayrollSummaryWidget } from './PayrollSummaryWidget'
import { AlertsPanel } from './AlertsPanel'
import { TopServicesList } from './TopServicesList'
import { TodayPulse } from './TodayPulse'
import { StaffUtilization } from './StaffUtilization'
import { StatsGridSkeleton, ChartSectionSkeleton, SidebarSectionSkeleton, TableSkeleton, TodayPulseSkeleton, StaffUtilizationSkeleton } from './DashboardSkeletons'
import type { Period } from '@/types/analytics'

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

function OverviewStatsGrid({ orgId, period }: { orgId: string; period: Period }) {
  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: dashboardKeys.overview(orgId, period),
    queryFn: () => getOverviewStats(orgId, period),
    select: (result) => result.success ? result.data : null,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    meta: { errorMessage: 'No se pudieron cargar las estadísticas' },
  })

  if (isLoading && !data) return <StatsGridSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const statsCards = [
    { title: 'Citas', value: data.appointments, change: data.appointmentsChange },
    { title: 'Ingresos', value: data.revenue, change: data.revenueChange },
    { title: 'Nuevos Clientes', value: data.clients, change: data.clientsChange },
    { title: 'Ticket Promedio', value: data.avgTicket, change: data.appointmentsChange },
    { title: 'Finalizadas', value: data.completionRate, suffix: '%', change: data.completionRateChange },
  ]

  const total = data.appointments
  const completed = data.completionRate && total
    ? Math.round((data.completionRate / 100) * total) : 0
  const cancelled = total > 0 ? Math.round(((total - completed) / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" style={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity 200ms' }}>
      {statsCards.map(s => (
        <MetricCard key={s.title} {...s} value={s.value} trendLabel="vs período anterior" />
      ))}
      <MetricCard title="Canceladas" value={cancelled} suffix="%" trendLabel="vs período anterior" />
    </div>
  )
}

function TrendChartSection({ orgId, period }: { orgId: string; period: Period }) {
  const days = period === 'year' ? 90 : period === 'month' ? 30 : period === 'week' ? 14 : 7
  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: dashboardKeys.trend(orgId, days),
    queryFn: () => getAppointmentsTrend(orgId, days),
    select: (result) => result.success ? result.data : null,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    meta: { errorMessage: 'No se pudo cargar la tendencia' },
  })

  if (isLoading && !data) return <ChartSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <TrendChart data={data} />
}

function RecentActivitySection({ orgId }: { orgId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: dashboardKeys.recentActivity(orgId, 8),
    queryFn: () => getRecentActivity(orgId, 8),
    select: (result) => result.success ? result.data : null,
    staleTime: 30 * 1000,
    meta: { errorMessage: 'No se pudo cargar la actividad reciente' },
  })

  if (isLoading) return <SidebarSectionSkeleton height="h-36" />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <RecentActivity activities={data} />
}

function UpcomingSection({ orgId }: { orgId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: dashboardKeys.upcoming(orgId, 5),
    queryFn: () => getUpcomingAppointments(orgId, 5),
    select: (result) => result.success ? result.data : null,
    staleTime: 30 * 1000,
    meta: { errorMessage: 'No se pudieron cargar las próximas citas' },
  })

  if (isLoading) return <SidebarSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <UpcomingAppointments appointments={data} />
}

function EmployeePerformanceSection({ orgId, period }: { orgId: string; period: Period }) {
  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: dashboardKeys.employeePerformance(orgId, period),
    queryFn: () => getEmployeePerformance(orgId, period),
    select: (result) => result.success ? result.data : null,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    meta: { errorMessage: 'No se pudo cargar el rendimiento' },
  })

  if (isLoading && !data) return <SidebarSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <EmployeePerformance employees={data} />
}

function PayrollSummarySection({ orgId }: { orgId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: dashboardKeys.payrollSummary(orgId),
    queryFn: () => getPayrollSummary(orgId),
    select: (result) => result.success ? result.data : null,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: 'No se pudo cargar el resumen de nómina' },
  })

  if (isLoading) return <SidebarSectionSkeleton height="h-32" />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <PayrollSummaryWidget summary={data} />
}

function AlertsSection({ orgId }: { orgId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: dashboardKeys.alerts(orgId),
    queryFn: () => getSystemAlerts(orgId),
    select: (result) => result.success ? result.data : null,
    staleTime: 60 * 1000,
    meta: { errorMessage: 'No se pudieron cargar las alertas' },
  })

  if (isLoading) return <SidebarSectionSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <AlertsPanel alerts={data} />
}

function TopServicesSection({ orgId, period }: { orgId: string; period: Period }) {
  const days = period === 'year' ? 365 : period === 'month' ? 30 : 7
  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: dashboardKeys.topServices(orgId, 5, days),
    queryFn: () => getTopServices(orgId, 5, days),
    select: (result) => result.success ? result.data : null,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    meta: { errorMessage: 'No se pudieron cargar los servicios populares' },
  })

  if (isLoading && !data) return <TableSkeleton rows={3} />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <TopServicesList services={data} />
}

function TodayPulseSection({ orgId }: { orgId: string }) {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: dashboardKeys.pulse(orgId),
    queryFn: () => getTodayPulse(orgId),
    select: (result) => result.success ? result.data : null,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
    meta: { errorMessage: 'No se pudo cargar el resumen de hoy' },
  })

  if (isLoading) return <TodayPulseSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <TodayPulse data={data} dataUpdatedAt={dataUpdatedAt} />
}

function StaffUtilizationSection({ orgId }: { orgId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: dashboardKeys.staffUtilization(orgId),
    queryFn: () => getStaffUtilization(orgId),
    select: (result) => result.success ? result.data : null,
    staleTime: 30 * 1000,
    meta: { errorMessage: 'No se pudo cargar la ocupación del equipo' },
  })

  if (isLoading) return <StaffUtilizationSkeleton />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return <StaffUtilization data={data} />
}

export {
  OverviewStatsGrid,
  TrendChartSection,
  RecentActivitySection,
  UpcomingSection,
  EmployeePerformanceSection,
  PayrollSummarySection,
  AlertsSection,
  TopServicesSection,
  TodayPulseSection,
  StaffUtilizationSection,
}
