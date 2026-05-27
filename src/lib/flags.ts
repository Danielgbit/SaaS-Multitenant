import { clientEnv } from './env/client'

if (!clientEnv) {
  throw new Error('Client env validation failed - cannot initialize flags')
}

export const flags = {
  showNewDashboardWidgets: clientEnv.NEXT_PUBLIC_FLAG_NEW_WIDGETS === 'true',
  showStaffUtilization: clientEnv.NEXT_PUBLIC_FLAG_STAFF_UTIL === 'true',
} as const
