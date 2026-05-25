'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { realtimeManager, handleRealtimeEvent } from '@/lib/realtime'

export function useRealtimeInvalidation(orgId: string) {
  const queryClient = useQueryClient()
  const orgIdRef = useRef(orgId)

  orgIdRef.current = orgId

  useEffect(() => {
    if (!orgId) return

    realtimeManager.init(orgId)

    const unsub = realtimeManager.on('appointments', (event) => {
      handleRealtimeEvent(orgIdRef.current, queryClient, event)
    })

    const unsubNotifications = realtimeManager.on('notifications', (event) => {
      handleRealtimeEvent(orgIdRef.current, queryClient, event)
    })

    return () => {
      unsub()
      unsubNotifications()
    }
  }, [orgId, queryClient])

  const invalidateNow = () => {
    if (orgId) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  return { invalidateNow }
}
