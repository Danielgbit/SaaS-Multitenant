'use client'

import { useMemo } from 'react'
import { Package, AlertTriangle, AlertCircle, DollarSign } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { computeInventoryStats } from '@/lib/inventory/inventory-stats'

interface InventoryKPIRowProps {
  items: InventoryItem[]
}

export function InventoryKPIRow({ items }: InventoryKPIRowProps) {
  const COLORS = useThemeColors()

  const kpis = useMemo(() => computeInventoryStats(items), [items])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total productos"
        value={kpis.total}
        icon={<Package className="w-5 h-5" />}
        iconColor={COLORS.primary}
      />
      <MetricCard
        title="Stock bajo"
        value={kpis.lowStock}
        icon={<AlertTriangle className="w-5 h-5" />}
        iconColor={COLORS.warning}
      />
      <MetricCard
        title="Sin stock"
        value={kpis.criticalStock}
        icon={<AlertCircle className="w-5 h-5" />}
        iconColor={COLORS.error}
      />
      <MetricCard
        title="Valor inventario"
        value={kpis.totalValue}
        prefix="$"
        icon={<DollarSign className="w-5 h-5" />}
        iconColor={COLORS.success}
      />
    </div>
  )
}
