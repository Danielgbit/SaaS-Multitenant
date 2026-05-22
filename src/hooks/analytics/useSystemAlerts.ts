'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSystemAlerts } from '@/actions/analytics/getSystemAlerts'

export interface AlertItem {
  id: string
  type: 'whatsapp_failed' | 'unconfirmed_appointment' | 'info'
  severity: 'warning' | 'info' | 'success'
  title: string
  description: string
  link?: string
  linkLabel?: string
  count: number
}

export function useSystemAlerts(organizationId: string) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AlertItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getSystemAlerts(organizationId)
    if (res.success) {
      setData(res.data!)
    } else {
      setError(res.error || 'Error al cargar alertas')
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
