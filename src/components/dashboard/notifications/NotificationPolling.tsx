'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface NotificationPollingProps {
  intervalMs?: number
  enabled?: boolean
}

export function NotificationPolling({
  intervalMs = 30000,
  enabled = true,
}: NotificationPollingProps) {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, intervalMs, router])

  return null
}
