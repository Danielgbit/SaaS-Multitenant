'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import * as inventoryService from '@/lib/inventory/inventory-service'

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  const result = await inventoryService.adjust({
    item_id: id,
    quantity,
    organization_id,
    created_by: user.id,
  })

  if (!result.success) {
    return { error: result.error }
  }

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { success: true }
}
