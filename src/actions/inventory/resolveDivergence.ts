'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { revalidatePath } from 'next/cache'
import * as inventoryService from '@/lib/inventory/inventory-service'
import { ASSISTED_RECONCILIATION_MAX_DELTA } from '@/lib/inventory/constants'

export async function resolveDivergence(
  divergenceId: string,
  action: 'align' | 'dismiss',
  organizationId: string,
  dismissReason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const access = await requireOrgAccess(organizationId, ['owner', 'admin'], supabase)
  if (!access.success) return access

  const { data: div } = await supabase
    .from('inventory_divergences')
    .select('*')
    .eq('id', divergenceId)
    .eq('organization_id', organizationId)
    .single()

  if (!div) return { success: false, error: 'Divergencia no encontrada.' }
  if (div.status !== 'open') return { success: false, error: 'Ya fue resuelta.' }

  if (action === 'align') {
    if (Math.abs(div.delta) > ASSISTED_RECONCILIATION_MAX_DELTA) {
      return { success: false, error: 'Delta excede el límite para alineación automática.' }
    }

    const result = await inventoryService.alignToLedger({
      item_id: div.inventory_item_id,
      target_quantity: div.ledger_stock,
      organization_id: organizationId,
      created_by: access.context.userId,
      divergence_id: divergenceId,
    })

    if (!result.success) return result

    const { data: updated } = await supabase
      .from('inventory_divergences')
      .update({
        status: 'resolved',
        resolution: 'aligned',
        resolved_at: new Date().toISOString(),
        resolved_current_stock: div.current_stock,
        resolved_ledger_stock: div.ledger_stock,
        action_taken: 'aligned',
        action_taken_at: new Date().toISOString(),
        action_taken_by: access.context.userId,
      } as any)
      .eq('id', divergenceId)
      .eq('status', 'open')
      .select()

    if (!updated?.length) {
      return { success: false, error: 'La divergencia fue modificada por otro usuario.' }
    }
  }

  if (action === 'dismiss') {
    const { data: updated } = await supabase
      .from('inventory_divergences')
      .update({
        status: 'resolved',
        resolution: 'dismissed',
        resolved_at: new Date().toISOString(),
        resolved_current_stock: div.current_stock,
        resolved_ledger_stock: div.ledger_stock,
        action_taken: 'dismissed',
        action_taken_at: new Date().toISOString(),
        action_taken_by: access.context.userId,
        dismiss_reason: dismissReason || null,
      } as any)
      .eq('id', divergenceId)
      .eq('status', 'open')
      .select()

    if (!updated?.length) {
      return { success: false, error: 'La divergencia fue modificada por otro usuario.' }
    }
  }

  revalidatePath('/inventario')
  revalidatePath('/inventario/metricas')
  return { success: true }
}
