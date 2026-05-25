import type { QueryClient } from '@tanstack/react-query'
import { startOfToday, endOfToday } from 'date-fns'
import { dashboardKeys } from '@/lib/query-keys'
import { notificationKeys } from '@/lib/query-keys'
import type { RealtimeEvent } from './types'

export function handleRealtimeEvent(orgId: string, queryClient: QueryClient, event: RealtimeEvent) {
  switch (event.table) {
    case 'appointments':
      invalidateOnAppointmentChange(orgId, queryClient, event)
      break
    case 'notifications':
      invalidateOnNotificationInsert(orgId, queryClient)
      break
  }
}

function isAppointmentToday(event: RealtimeEvent): boolean {
  const payload = event.payload
  const newRecord = payload.new as Record<string, unknown> | null
  const oldRecord = payload.old as Record<string, unknown> | null

  const startTime = (newRecord?.start_time as string | undefined) || (oldRecord?.start_time as string | undefined)

  if (!startTime) return false

  const aptDate = new Date(startTime)
  const todayStart = startOfToday()
  const todayEnd = endOfToday()

  return aptDate >= todayStart && aptDate <= todayEnd
}

function invalidateOnAppointmentChange(orgId: string, queryClient: QueryClient, event: RealtimeEvent) {
  const isToday = isAppointmentToday(event)

  queryClient.invalidateQueries({ queryKey: dashboardKeys.overview(orgId, '_' as any) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.trend(orgId, 999) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.topServices(orgId, 999, 999) })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.upcoming(orgId) })
  queryClient.invalidateQueries({ queryKey: notificationKeys.confirmations(orgId) })

  if (isToday) {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.pulse(orgId) as any })
    queryClient.invalidateQueries({ queryKey: dashboardKeys.staffUtilization(orgId) as any })
  }
}

function invalidateOnNotificationInsert(orgId: string, queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: dashboardKeys.alerts(orgId) })
  queryClient.invalidateQueries({ queryKey: notificationKeys.all })
}
