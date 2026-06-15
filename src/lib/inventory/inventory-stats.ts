import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

export interface InventoryStats {
  total: number
  lowStock: number
  criticalStock: number
  totalValue: number
}

export function computeInventoryStats(items: InventoryItem[]): InventoryStats {
  let total = 0
  let lowStock = 0
  let criticalStock = 0
  let totalValue = 0
  for (const item of items) {
    total++
    if (item.quantity === 0) criticalStock++
    else if (item.quantity <= item.min_quantity) lowStock++
    if (item.cost_price != null) {
      totalValue += item.quantity * item.cost_price
    }
  }
  return { total, lowStock, criticalStock, totalValue }
}
