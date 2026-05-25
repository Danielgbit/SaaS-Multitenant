import type { QueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/lib/query-keys'
import { notificationKeys } from '@/lib/query-keys'
import type { RealtimeEvent } from './types'

export function handleRealtimeEvent(orgId: string, queryClient: QueryClient, event: RealtimeEvent) {
  switch (event.table) {
    case 'appointments':
      invalidateOnAppointmentChange(orgId, queryClient)
      break
    case 'notifications':
      invalidateOnNotificationInsert(orgId, queryClient)
      break
  }
}

function invalidateOnAppointmentChange(orgId: string, queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: dashboardKeys.overview(orgId, '_' as any) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.trend(orgId, 999) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.topServices(orgId, 999, 999) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.upcoming(orgId) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.recentActivity(orgId) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.employeePerformance(orgId, '_' as any) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.payrollSummary(orgId) })

  queryClient.invalidateQueries({ queryKey: notificationKeys.confirmations(orgId) })
}

function invalidateOnNotificationInsert(orgId: string, queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: dashboardKeys.alerts(orgId) })
  queryClient.invalidateQueries({ queryKey: notificationKeys.all })
}
