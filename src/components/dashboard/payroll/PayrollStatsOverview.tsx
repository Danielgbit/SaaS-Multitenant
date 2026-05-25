'use client'

import { Users, TrendingUp, AlertTriangle, Wallet } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface PayrollStatsOverviewProps {
  employeeCount: number
  totalCommissions: number
  totalDebt: number
  totalNet: number
  loading: boolean
}

export function PayrollStatsOverview({ employeeCount, totalCommissions, totalDebt, totalNet, loading }: PayrollStatsOverviewProps) {
  const COLORS = useThemeColors()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
            <Users className="w-4 h-4" style={{ color: COLORS.primary }} />
          </div>
          <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Empleados</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{employeeCount}</p>
      </div>
      <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
          </div>
          <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Total Comisiones</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{loading ? '...' : formatCurrencyCOP(totalCommissions)}</p>
      </div>
      <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
          </div>
          <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Total Préstamos</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{loading ? '...' : formatCurrencyCOP(totalDebt)}</p>
      </div>
      <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
            <Wallet className="w-4 h-4" style={{ color: COLORS.success }} />
          </div>
          <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Neto Total a Pagar</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{loading ? '...' : formatCurrencyCOP(totalNet)}</p>
      </div>
    </div>
  )
}
