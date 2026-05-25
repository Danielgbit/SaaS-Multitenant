export const flags = {
  showNewDashboardWidgets: process.env.NEXT_PUBLIC_FLAG_NEW_WIDGETS === 'true',
  showStaffUtilization: process.env.NEXT_PUBLIC_FLAG_STAFF_UTIL === 'true',
} as const
