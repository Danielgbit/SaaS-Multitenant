import { describe, it, expect } from 'vitest'
import { computeInventoryStats } from '../inventory-stats'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    organization_id: 'org-1',
    name: 'Test',
    quantity: 10,
    min_quantity: 5,
    unit: 'pieza',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  } as InventoryItem
}

describe('computeInventoryStats', () => {
  it('returns all zeros for empty items', () => {
    const stats = computeInventoryStats([])
    expect(stats).toEqual({ total: 0, lowStock: 0, criticalStock: 0, totalValue: 0 })
  })

  it('counts all as in stock when quantity > min_quantity', () => {
    const items = [makeItem({ quantity: 10, min_quantity: 5 })]
    const stats = computeInventoryStats(items)
    expect(stats.total).toBe(1)
    expect(stats.lowStock).toBe(0)
    expect(stats.criticalStock).toBe(0)
  })

  it('counts low stock when quantity <= min_quantity and > 0', () => {
    const items = [makeItem({ quantity: 3, min_quantity: 5 })]
    const stats = computeInventoryStats(items)
    expect(stats.lowStock).toBe(1)
    expect(stats.criticalStock).toBe(0)
  })

  it('counts critical stock when quantity is 0', () => {
    const items = [makeItem({ quantity: 0, min_quantity: 5 })]
    const stats = computeInventoryStats(items)
    expect(stats.criticalStock).toBe(1)
    expect(stats.lowStock).toBe(0)
  })

  it('computes totalValue correctly with mixed items', () => {
    const items = [
      makeItem({ quantity: 5, cost_price: 1000 }),
      makeItem({ quantity: 3, cost_price: 2000 }),
      makeItem({ id: 'item-3', name: 'NoCost', quantity: 10, cost_price: null } as unknown as InventoryItem),
    ]
    const stats = computeInventoryStats(items)
    expect(stats.total).toBe(3)
    expect(stats.totalValue).toBe(5 * 1000 + 3 * 2000)
    expect(stats.lowStock).toBe(2)
    expect(stats.criticalStock).toBe(0)
  })
})
