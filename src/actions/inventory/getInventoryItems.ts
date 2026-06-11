'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'

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

/**
 * Filtros de búsqueda para inventario.
 * Nota: cuando lowStock=true, los filtros search y category son ignorados
 * porque el RPC subyacente (get_low_stock_items) no los soporta.
 * Para filtrar por búsqueda o categoría, no uses lowStock y maneja la
 * lógica de low-stock en el cliente usando min_quantity.
 */
export interface GetInventoryFilters {
  search?: string
  category?: string
  lowStock?: boolean
}

export async function getInventoryItems(
  organizationId: string,
  filters?: GetInventoryFilters
): Promise<InventoryItem[]> {
  const access = await requireOrgAccess(organizationId)
  if (!access.success) return []
  const supabase = await createClient()

  if (filters?.lowStock) {
    const { data, error } = await supabase.rpc('get_low_stock_items' as any, {
      p_organization_id: organizationId,
      p_include_zero_min: false,
    })

    if (error) {
      captureError('inventory_get_items_rpc_error', error, { organizationId })
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
    captureError('inventory_get_items_error', error, { organizationId })
    return []
  }

  return (data as InventoryItem[]) || []
}

export async function getInventoryCategories(
  organizationId: string
): Promise<string[]> {
  const access = await requireOrgAccess(organizationId)
  if (!access.success) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('category')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .not('category', 'is', null)

  if (error) {
    captureError('inventory_get_categories_error', error, { organizationId })
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
  const access = await requireOrgAccess(organizationId)
  if (!access.success) return 0
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('active', true)

  if (error) {
    captureError('inventory_get_count_error', error, { organizationId })
    return 0
  }

  return count || 0
}

export async function getLowStockItems(
  organizationId: string
): Promise<InventoryItem[]> {
  const access = await requireOrgAccess(organizationId)
  if (!access.success) return []
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_low_stock_items' as any, {
    p_organization_id: organizationId,
    p_include_zero_min: false,
  })

  if (error) {
    captureError('inventory_low_stock_error', error, { organizationId })
    return []
  }

  return (data as InventoryItem[]) || []
}
