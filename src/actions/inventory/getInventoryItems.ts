'use server'

import { createClient } from '@/lib/supabase/server'

export interface InventoryItem {
  id: string
  organization_id: string
  name: string
  sku: string | null
  description: string | null
  category: string | null
  quantity: number
  min_quantity: number
  price: number | null
  cost_price: number | null
  unit: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface GetInventoryFilters {
  search?: string
  category?: string
  lowStock?: boolean
}

export async function getInventoryItems(
  organizationId: string,
  filters?: GetInventoryFilters
): Promise<InventoryItem[]> {
  const supabase = await createClient()

  if (filters?.lowStock) {
    const { data, error } = await supabase.rpc('get_low_stock_items', {
      p_organization_id: organizationId,
      p_include_zero_min: false,
    })

    if (error) {
      console.error('[getInventoryItems] RPC error:', error)
      return []
    }

    return (data as InventoryItem[]) || []
  }

  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('name', { ascending: true })

  if (filters?.search) {
    const search = filters.search.toLowerCase()
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getInventoryItems] Error:', error)
    return []
  }

  return (data as InventoryItem[]) || []
}

export async function getInventoryCategories(
  organizationId: string
): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('category')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .not('category', 'is', null)

  if (error) {
    console.error('[getInventoryCategories] Error:', error)
    return []
  }

  const categories = new Set<string>()
  data?.forEach((item: { category: string | null }) => {
    if (item.category) categories.add(item.category)
  })

  return Array.from(categories).sort()
}

export async function getInventoryCount(
  organizationId: string
): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('active', true)

  if (error) {
    console.error('[getInventoryCount] Error:', error)
    return 0
  }

  return count || 0
}

export async function getLowStockItems(
  organizationId: string
): Promise<InventoryItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_low_stock_items', {
    p_organization_id: organizationId,
    p_include_zero_min: false,
  })

  if (error) {
    console.error('[getLowStockItems] RPC error:', error)
    return []
  }

  return (data as InventoryItem[]) || []
}
