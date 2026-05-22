'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUpcomingAppointments } from '@/actions/analytics/getUpcomingAppointments'

export interface UpcomingAppointmentItem {
  id: string
  start_time: string
  status: string
  client_name: string
  client_phone: string | null
  service_name: string | null
  employee_name: string | null
  employee_id: string | null
}

export function useUpcomingAppointments(organizationId: string, limit: number = 5) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UpcomingAppointmentItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getUpcomingAppointments(organizationId, limit)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar citas')
    }
    setLoading(false)
  }, [organizationId, limit])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
