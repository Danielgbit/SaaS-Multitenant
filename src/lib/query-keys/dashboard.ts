import type { Period } from '@/types/analytics'

export const dashboardKeys = {
  all: ['dashboard'] as const,

  overview: (orgId: string, period: Period) =>
    [...dashboardKeys.all, 'overview', orgId, period] as const,

  trend: (orgId: string, days: number) =>
    [...dashboardKeys.all, 'trend', orgId, days] as const,

  topServices: (orgId: string, limit: number, days: number) =>
    [...dashboardKeys.all, 'top-services', orgId, limit, days] as const,

  upcoming: (orgId: string, limit?: number) =>
    [...dashboardKeys.all, 'upcoming', orgId, limit] as const,

  recentActivity: (orgId: string, limit?: number) =>
    [...dashboardKeys.all, 'activity', orgId, limit] as const,

  employeePerformance: (orgId: string, period: Period) =>
    [...dashboardKeys.all, 'employees', orgId, period] as const,

  payrollSummary: (orgId: string) =>
    [...dashboardKeys.all, 'payroll', orgId] as const,

  alerts: (orgId: string) =>
    [...dashboardKeys.all, 'alerts', orgId] as const,
} as const
