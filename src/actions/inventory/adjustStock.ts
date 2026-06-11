'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import * as inventoryService from '@/lib/inventory/inventory-service'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'

const AdjustStockSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
  organization_id: z.string().uuid('ID de organización inválido'),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
})

type AdjustStockInput = z.infer<typeof AdjustStockSchema>

export async function adjustStock(
  input: AdjustStockInput
): Promise<{ error?: string; success?: boolean }> {
  const parsed = AdjustStockSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { id, organization_id, quantity } = parsed.data

  const supabase = await createClient()

  const access = await requireOrgAccess(organization_id, ['owner', 'admin'], supabase)
  if (!access.success) return { error: access.error }

  let result: Awaited<ReturnType<typeof inventoryService.adjust>>
  try {
    result = await inventoryService.adjust({
      item_id: id,
      quantity,
      organization_id,
      created_by: access.context.userId,
    })
  } catch (error) {
    captureError('inventory_adjust_failed', error, { id, organization_id })
    return { error: 'Error al ajustar el stock. Intenta de nuevo.' }
  }
  if (!result.success) {
    return { error: result.error }
  }

  revalidatePath('/inventario')
  revalidatePath('/dashboard')

  return { success: true }
}
