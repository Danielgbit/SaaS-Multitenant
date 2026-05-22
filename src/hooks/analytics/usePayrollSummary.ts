'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPayrollSummary } from '@/actions/payroll/getPayrollSummary'

export interface PayrollSummaryData {
  employeeCount: number
  employeesWithCommission: number
  pendingCommissionsTotal: number
  pendingLoansTotal: number
}

export function usePayrollSummary(organizationId: string) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PayrollSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getPayrollSummary(organizationId)
    if (res.success && res.data) {
      setData(res.data)
    } else {
      setError(res.error || 'Error al cargar resumen de nómina')
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { loading, data, error, refetch: fetch }
}
