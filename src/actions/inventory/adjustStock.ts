'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AdjustStockSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
  organization_id: z.string().uuid('ID de organización inválido'),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
})

type AdjustStockInput = z.infer<typeof AdjustStockSchema>

export async function adjustStock(
  input: AdjustStockInput
): Promise<{ error?: string; success?: boolean }> {
  console.log('[adjustStock] Input:', input)

  const parsed = AdjustStockSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[adjustStock] Validation failed:', parsed.error.issues)
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

  const { error: updateError } = await (supabase as any)
    .from('inventory_items')
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organization_id)

  if (updateError) {
    console.error('[adjustStock] Update error:', updateError)
    return { error: 'Error al ajustar el stock. Intenta de nuevo.' }
  }

  console.log('[adjustStock] Stock adjusted successfully:', id, 'to', quantity)

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { success: true }
}
