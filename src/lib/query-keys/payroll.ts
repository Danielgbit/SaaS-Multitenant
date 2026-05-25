export const payrollKeys = {
  all: ['payroll'] as const,

  summary: (orgId: string) =>
    [...payrollKeys.all, 'summary', orgId] as const,

  periods: (orgId: string) =>
    [...payrollKeys.all, 'periods', orgId] as const,

  periodById: (orgId: string, periodId: string) =>
    [...payrollKeys.all, 'period', orgId, periodId] as const,

  items: (orgId: string, periodId: string) =>
    [...payrollKeys.all, 'items', orgId, periodId] as const,

  employeeCommission: (employeeId: string, start: string, end: string) =>
    [...payrollKeys.all, 'commission', employeeId, start, end] as const,
} as const
