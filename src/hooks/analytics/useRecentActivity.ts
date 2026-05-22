'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRecentActivity } from '@/actions/analytics/getRecentActivity'

export interface ActivityItem {
  id: string
  type: 'appointment_created' | 'appointment_completed' | 'appointment_cancelled' | 'client_registered'
  title: string
  description: string
  timestamp: string
}

export function useRecentActivity(organizationId: string, limit: number = 8) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ActivityItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getRecentActivity(organizationId, limit)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar actividad')
    }
    setLoading(false)
  }, [organizationId, limit])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
