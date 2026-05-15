'use client'

import Link from 'next/link'
import { Receipt, Users, TrendingUp, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface PayrollSummary {
  employeeCount: number
  employeesWithCommission: number
  pendingCommissionsTotal: number
  pendingLoansTotal: number
}

interface PayrollSummaryWidgetProps {
  summary: PayrollSummary | undefined
  loading: boolean
}

export function PayrollSummaryWidget({ summary, loading }: PayrollSummaryWidgetProps) {
  const COLORS = useThemeColors()

  if (loading) {
    return (
      <Card variant="solid" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5" style={{ color: COLORS.textMuted }} />
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Nómina</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.textMuted }} />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="solid" className="p-0 overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5" style={{ color: COLORS.success }} />
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Nómina</h3>
        </div>
        <Link
          href="/payroll"
          className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
          style={{ color: COLORS.primary }}
        >
          Ver todo
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Empleados</span>
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
              {summary?.employeeCount || 0}
            </p>
          </div>

          <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Comisiones</span>
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.success }}>
              {formatCurrencyCOP(summary?.pendingCommissionsTotal || 0)}
            </p>
          </div>
        </div>

        {(summary?.pendingLoansTotal || 0) > 0 && (
          <div
            className="rounded-lg p-3 border"
            style={{
              backgroundColor: COLORS.warningLight,
              borderColor: COLORS.warning,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4" style={{ color: COLORS.warning }} />
              <span className="text-xs" style={{ color: COLORS.warning }}>Préstamos Pendientes</span>
            </div>
            <p className="text-lg font-bold" style={{ color: COLORS.warning }}>
              {formatCurrencyCOP(summary?.pendingLoansTotal || 0)}
            </p>
          </div>
        )}

        <Link
          href="/payroll"
          className="block w-full py-2 px-3 rounded-lg text-sm font-medium text-center transition-colors hover:opacity-90"
          style={{
            backgroundColor: COLORS.successLight,
            color: COLORS.success,
          }}
        >
          Gestionar Nómina
        </Link>
      </div>
    </Card>
  )
}
