'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOverviewStats } from '@/actions/analytics/getOverviewStats'

export type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

export interface OverviewStats {
  appointments: number
  appointmentsChange: number
  revenue: number
  revenueChange: number
  clients: number
  clientsChange: number
  completionRate: number
  completionRateChange: number
  avgTicket: number
}

export function useOverviewStats(organizationId: string, period: Period) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getOverviewStats(organizationId, period)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar estadísticas')
    }
    setLoading(false)
  }, [organizationId, period])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
