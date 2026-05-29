'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { PaymentMethod } from '@/types/cash-sessions'

export async function recordInventoryPurchase(input: {
  item_id: string
  quantity: number
  unit_cost: number
  payment_status: 'paid' | 'pending'
  payment_method?: PaymentMethod
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

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo administradores.' }
  }

  if (input.quantity <= 0 || input.unit_cost <= 0) {
    return { success: false, error: 'Cantidad y costo deben ser > 0.' }
  }

  const totalCost = input.quantity * input.unit_cost

  // Incrementar stock
  const { error: stockError } = await supabase
    .from('inventory_items')
    .update({ quantity: item.quantity + input.quantity, updated_at: new Date().toISOString() })
    .eq('id', input.item_id)

  if (stockError) return { success: false, error: 'Error al actualizar stock.' }

  // Si es pagado, crear movimiento de caja
  if (input.payment_status === 'paid') {
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
        entry_type: 'inventory_purchase',
        entry_group: 'inventory',
        entry_status: 'active',
        created_via: 'inventory_auto',
        direction: 'out',
        title: `Compra: ${item.name} x${input.quantity}`,
        description: input.notes || null,
        amount: totalCost,
        payment_method: input.payment_method || null,
        source_type: 'inventory',
        source_id: input.item_id,
        created_by: user.id,
        metadata: { quantity: input.quantity, unit_cost: input.unit_cost, payment_status: input.payment_status },
      })
    }
  }

  revalidatePath('/inventory')
  revalidatePath('/caja')

  return { success: true }
}
