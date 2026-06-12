import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@db/supabase'

type Supa = SupabaseClient<Database>

export interface CreateItemWithLimitCheckParams {
  p_organization_id: string
  p_name: string
  p_sku: string | null
  p_description: string | null
  p_category: string | null
  p_quantity: number
  p_min_quantity: number
  p_price: number | null
  p_cost_price: number | null
  p_unit: string
  p_created_by: string
}

export interface CreateItemWithLimitCheckResult {
  success: boolean
  error?: string
  message?: string
  id?: string
}

export async function callCreateItemWithLimitCheck(
  supabase: Supa,
  params: CreateItemWithLimitCheckParams,
): Promise<{ data: CreateItemWithLimitCheckResult[] | null; error: unknown }> {
  return (supabase.rpc as any)(
    'inventory_create_item_with_limit_check',
    params,
  ) as Promise<{ data: CreateItemWithLimitCheckResult[] | null; error: unknown }>
}

export async function callGetLowStockItems(
  supabase: Supa,
  params: { p_organization_id: string; p_include_zero_min?: boolean },
) {
  return supabase.rpc('get_low_stock_items', params)
}
