'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTopServices } from '@/actions/analytics/getTopServices'

export interface TopServiceItem {
  serviceId: string
  serviceName: string
  count: number
  percentage: number
  revenue: number
}

export function useTopServices(organizationId: string, limit: number = 5, days: number = 30) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TopServiceItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getTopServices(organizationId, limit, days)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar servicios')
    }
    setLoading(false)
  }, [organizationId, limit, days])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
