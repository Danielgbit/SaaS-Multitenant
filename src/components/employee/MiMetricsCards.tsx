'use client'

import { CalendarCheck, DollarSign, TrendingUp, Zap } from 'lucide-react'
import { MiMiniStat } from './MiMiniStat'
import type { EmployeeMetrics } from '@/types/employee-metrics'

interface Props {
  metrics: EmployeeMetrics
}

export function MiMetricsCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MiMiniStat
        label="Completadas este mes"
        value={metrics.completedThisMonth}
        icon={<CalendarCheck className="w-5 h-5" />}
        trend={metrics.completedThisMonth > 0 ? 'up' : 'neutral'}
      />
      <MiMiniStat
        label="Ingresos generados"
        value={`$${metrics.revenueThisMonth.toLocaleString('es-CO')}`}
        icon={<DollarSign className="w-5 h-5" />}
        trend={metrics.revenueThisMonth > 0 ? 'up' : 'neutral'}
      />
      <MiMiniStat
        label="Completion rate"
        value={`${metrics.completionRate}%`}
        icon={<TrendingUp className="w-5 h-5" />}
        trend={metrics.completionRate >= 80 ? 'up' : metrics.completionRate >= 50 ? 'neutral' : 'down'}
      />
      <MiMiniStat
        label="Racha"
        value={`${metrics.streak} días`}
        icon={<Zap className="w-5 h-5" />}
        trend={metrics.streak >= 5 ? 'up' : metrics.streak >= 1 ? 'neutral' : 'down'}
      />
    </div>
  )
}
