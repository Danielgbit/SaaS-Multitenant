'use client'

import { useState, useEffect, useCallback } from 'react'
import { getEmployeePerformance } from '@/actions/analytics/getEmployeePerformance'
import type { Period } from './useOverviewStats'

export interface EmployeePerformanceItem {
  employee_id: string
  employee_name: string
  appointments: number
  revenue: number
  completed: number
}

export function useEmployeePerformance(organizationId: string, period: Period) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EmployeePerformanceItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getEmployeePerformance(organizationId, period)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar rendimiento')
    }
    setLoading(false)
  }, [organizationId, period])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
