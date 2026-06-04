'use client'

import {
  BuildingIcon, Users, TrendingUp, TicketIcon, DollarSign, AlertCircle,
} from 'lucide-react'
import { AdminMetricCard } from './MetricCard'
import type { PlatformMetrics } from '@/lib/admin/types'

interface MetricsGridProps {
  metrics: PlatformMetrics
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminMetricCard
          label="Organizaciones"
          value={metrics.totalOrganizations}
          icon={BuildingIcon}
          color="#0EA5E9"
        />
        <AdminMetricCard
          label="Usuarios"
          value={metrics.totalUsers}
          icon={Users}
          color="#16A34A"
        />
        <AdminMetricCard
          label="MRR"
          value={metrics.mrr}
          prefix="$"
          icon={DollarSign}
          color="#0F4C5C"
        />
        <AdminMetricCard
          label="ARR"
          value={metrics.arr}
          prefix="$"
          icon={TrendingUp}
          color="#14B8A6"
        />
        <AdminMetricCard
          label="Trials Activos"
          value={metrics.trialOrganizations}
          icon={AlertCircle}
          color="#0EA5E9"
        />
        <AdminMetricCard
          label="Suscripciones"
          value={metrics.activeSubscriptions}
          icon={TrendingUp}
          color="#16A34A"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminMetricCard
          label="Suspendidos"
          value={metrics.suspendedOrganizations}
          icon={AlertCircle}
          color="#D97706"
        />
        <AdminMetricCard
          label="Ingresos del Mes"
          value={metrics.monthlyRevenue}
          prefix="$"
          icon={DollarSign}
          color="#0F4C5C"
        />
        <AdminMetricCard
          label="Promo Codes"
          value={metrics.activePromoCodes}
          icon={TicketIcon}
          color="#14B8A6"
        />
        <AdminMetricCard
          label="Usuarios Activos"
          value={metrics.activeUsers}
          icon={Users}
          color="#16A34A"
        />
      </div>
    </div>
  )
}
