'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Receipt, 
  Users, 
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { getPayrollSummary } from '@/actions/payroll/getPayrollSummary'
import { formatCurrencyCOP } from '@/lib/billing/utils'

export function PayrollSummaryWidget({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<{
    employeeCount: number
    employeesWithCommission: number
    pendingCommissionsTotal: number
    pendingLoansTotal: number
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    setLoading(true)
    const result = await getPayrollSummary(organizationId)
    if (result.success && result.data) {
      setSummary({
        employeeCount: result.data.employeeCount,
        employeesWithCommission: result.data.employeesWithCommission,
        pendingCommissionsTotal: result.data.pendingCommissionsTotal,
        pendingLoansTotal: result.data.pendingLoansTotal,
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Nómina</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Nómina</h3>
        </div>
        <Link 
          href="/payroll"
          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          Ver todo
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Empleados</span>
            </div>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-100">
              {summary?.employeeCount || 0}
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Comisiones</span>
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrencyCOP(summary?.pendingCommissionsTotal || 0)}
            </p>
          </div>
        </div>

        {(summary?.pendingLoansTotal || 0) > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700 dark:text-amber-400">Préstamos Pendientes</span>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
              {formatCurrencyCOP(summary?.pendingLoansTotal || 0)}
            </p>
          </div>
        )}

        <Link
          href="/payroll"
          className="block w-full py-2 px-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-lg text-center transition-colors"
        >
          Gestionar Nómina
        </Link>
      </div>
    </div>
  )
}