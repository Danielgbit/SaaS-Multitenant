'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'

export async function consumeInventory(input: {
  item_id: string
  quantity: number
  estimated_cost?: number
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, organization_id')
    .eq('id', input.item_id)
    .single()

  if (!item) return { success: false, error: 'Producto no encontrado.' }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', item.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { success: false, error: 'Sin permiso.' }
  }

  if (input.quantity <= 0) return { success: false, error: 'Cantidad debe ser > 0.' }
  if (item.quantity < input.quantity) return { success: false, error: 'Stock insuficiente.' }

  const newQuantity = item.quantity - input.quantity

  const { error: stockError } = await supabase
    .from('inventory_items')
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', input.item_id)

  if (stockError) return { success: false, error: 'Error al actualizar stock.' }

  // Registrar consumo interno en caja (informativo, NO afecta expected_cash)
  const today = getTodayDateColombia()
  const { data: session } = await (supabase as any)
    .from('cash_sessions')
    .select('id')
    .eq('organization_id', item.organization_id)
    .eq('session_date', today)
    .eq('status', 'open')
    .maybeSingle()

  if (session) {
    await (supabase as any).from('operation_entries').insert({
      cash_session_id: session.id,
      entry_type: 'inventory_out',
      entry_group: 'inventory',
      entry_status: 'active',
      created_via: 'inventory_auto',
      direction: null,
      title: `Consumo: ${item.name} x${input.quantity}`,
      description: input.notes || null,
      amount: 0,
      payment_method: null,
      source_type: 'inventory',
      source_id: input.item_id,
      created_by: user.id,
      metadata: {
        quantity: input.quantity,
        estimated_cost: input.estimated_cost || null,
        remaining_stock: newQuantity,
      },
    })
  }

  revalidatePath('/inventory')
  revalidatePath('/caja')

  return { success: true }
}
