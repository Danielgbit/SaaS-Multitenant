'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAppointmentsTrend } from '@/actions/analytics/getAppointmentsTrend'

export interface TrendPoint {
  date: string
  label: string
  appointments: number
  completed: number
  revenue: number
}

export function useRevenueTrend(organizationId: string, days: number = 30) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TrendPoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getAppointmentsTrend(organizationId, days)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar tendencias')
    }
    setLoading(false)
  }, [organizationId, days])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
