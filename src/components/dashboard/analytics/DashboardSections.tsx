'use client'

import { Suspense } from 'react'
import { useServerActionResult } from '@/lib/use-server-action'
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

function OverviewStatsGrid({ orgId, period }: { orgId: string; period: Period }) {
  const result = useServerActionResult(
    () => getOverviewStats(orgId, period),
    [orgId, period]
  )

  const statsCards = [
    { title: 'Citas', value: result.data!.appointments, change: result.data!.appointmentsChange },
    { title: 'Ingresos', value: result.data!.revenue, change: result.data!.revenueChange },
    { title: 'Nuevos Clientes', value: result.data!.clients, change: result.data!.clientsChange },
    { title: 'Ticket Promedio', value: result.data!.avgTicket, change: result.data!.appointmentsChange },
    { title: 'Finalizadas', value: result.data!.completionRate, suffix: '%', change: result.data!.completionRateChange },
  ]

  const total = result.data!.appointments
  const completed = result.data!.completionRate && total
    ? Math.round((result.data!.completionRate / 100) * total) : 0
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

export function SuspenseOverviewStats({ orgId, period }: { orgId: string; period: Period }) {
  return (
    <Suspense fallback={<StatsGridSkeleton />}>
      <OverviewStatsGrid orgId={orgId} period={period} />
    </Suspense>
  )
}

function TrendChartSection({ orgId, days }: { orgId: string; days: number }) {
  const result = useServerActionResult(
    () => getAppointmentsTrend(orgId, days),
    [orgId, days]
  )

  return <TrendChart data={result.data!} loading={false} />
}

export function SuspenseTrendChart({ orgId, period }: { orgId: string; period: Period }) {
  const days = period === 'year' ? 90 : period === 'month' ? 30 : period === 'week' ? 14 : 7

  return (
    <Suspense fallback={<ChartSectionSkeleton />}>
      <TrendChartSection orgId={orgId} days={days} />
    </Suspense>
  )
}

function RecentActivitySection({ orgId, limit }: { orgId: string; limit: number }) {
  const result = useServerActionResult(
    () => getRecentActivity(orgId, limit),
    [orgId, limit]
  )

  return <RecentActivity activities={result.data!} loading={false} />
}

export function SuspenseRecentActivity({ orgId }: { orgId: string }) {
  return (
    <Suspense fallback={<SidebarSectionSkeleton height="h-36" />}>
      <RecentActivitySection orgId={orgId} limit={8} />
    </Suspense>
  )
}

function UpcomingSection({ orgId, limit }: { orgId: string; limit: number }) {
  const result = useServerActionResult(
    () => getUpcomingAppointments(orgId, limit),
    [orgId, limit]
  )

  return <UpcomingAppointments appointments={result.data!} loading={false} />
}

export function SuspenseUpcoming({ orgId }: { orgId: string }) {
  return (
    <Suspense fallback={<SidebarSectionSkeleton />}>
      <UpcomingSection orgId={orgId} limit={5} />
    </Suspense>
  )
}

function EmployeePerformanceSection({ orgId, period }: { orgId: string; period: Period }) {
  const result = useServerActionResult(
    () => getEmployeePerformance(orgId, period),
    [orgId, period]
  )

  return <EmployeePerformance employees={result.data!} loading={false} />
}

export function SuspenseEmployeePerformance({ orgId, period }: { orgId: string; period: Period }) {
  return (
    <Suspense fallback={<SidebarSectionSkeleton />}>
      <EmployeePerformanceSection orgId={orgId} period={period} />
    </Suspense>
  )
}

function PayrollSummarySection({ orgId }: { orgId: string }) {
  const result = useServerActionResult(
    () => getPayrollSummary(orgId),
    [orgId]
  )

  return <PayrollSummaryWidget summary={result.data!} loading={false} />
}

export function SuspensePayrollSummary({ orgId }: { orgId: string }) {
  return (
    <Suspense fallback={<SidebarSectionSkeleton height="h-32" />}>
      <PayrollSummarySection orgId={orgId} />
    </Suspense>
  )
}

function AlertsSection({ orgId }: { orgId: string }) {
  const result = useServerActionResult(
    () => getSystemAlerts(orgId),
    [orgId]
  )

  return <AlertsPanel alerts={result.data!} loading={false} />
}

export function SuspenseAlerts({ orgId }: { orgId: string }) {
  return (
    <Suspense fallback={<SidebarSectionSkeleton />}>
      <AlertsSection orgId={orgId} />
    </Suspense>
  )
}

function TopServicesSection({ orgId, period }: { orgId: string; period: Period }) {
  const days = period === 'year' ? 365 : period === 'month' ? 30 : 7
  const result = useServerActionResult(
    () => getTopServices(orgId, 5, days),
    [orgId, days]
  )

  return <TopServicesList services={result.data!} loading={false} />
}

export function SuspenseTopServices({ orgId, period }: { orgId: string; period: Period }) {
  return (
    <Suspense fallback={<TableSkeleton rows={3} />}>
      <TopServicesSection orgId={orgId} period={period} />
    </Suspense>
  )
}
