'use server'

import { createClient } from '@/lib/supabase/server'
import type { InventoryItemWithStock } from '@/types/clientAccounts'

export async function getInventoryProducts(
  organizationId: string,
  options?: {
    category?: string
    activeOnly?: boolean
    lowStockOnly?: boolean
  }
): Promise<{
  success: boolean
  data?: InventoryItemWithStock[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  let query = (supabase as any)
    .from('inventory_items')
    .select('*')
    .eq('organization_id', organizationId)

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.activeOnly !== false) {
    query = query.eq('active', true)
  }

  if (options?.lowStockOnly) {
    query = query.lte('quantity', 'min_quantity')
  }

  query = query.order('name')

  const { data: items, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: items }
}

export async function getInventoryCategories(
  organizationId: string
): Promise<{
  success: boolean
  data?: string[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await (supabase as any)
    .from('inventory_items')
    .select('category')
    .eq('organization_id', organizationId)
    .not('category', 'is', null)
    .order('category')

  if (error) {
    return { success: false, error: error.message }
  }

  const categories = [...new Set((data || []).map((item: any) => item.category).filter(Boolean))] as string[]
  return { success: true, data: categories }
}

export async function updateInventoryStock(
  organizationId: string,
  inventoryItemId: string,
  quantityChange: number,
  reason?: string
): Promise<{
  success: boolean
  data?: {
    new_quantity: number
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: item, error: fetchError } = await (supabase as any)
    .from('inventory_items')
    .select('id, quantity')
    .eq('id', inventoryItemId)
    .eq('organization_id', organizationId)
    .single()

  if (fetchError || !item) {
    return { success: false, error: 'Producto no encontrado' }
  }

  const newQuantity = item.quantity + quantityChange

  if (newQuantity < 0) {
    return { success: false, error: 'No hay suficiente stock' }
  }

  const { error: updateError } = await (supabase as any)
    .from('inventory_items')
    .update({
      quantity: newQuantity,
    })
    .eq('id', inventoryItemId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, data: { new_quantity: newQuantity } }
}
