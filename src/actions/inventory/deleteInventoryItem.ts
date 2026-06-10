'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { z } from 'zod'

const DeleteInventoryItemSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
  organization_id: z.string().uuid('ID de organización inválido'),
})

type DeleteInventoryItemInput = z.infer<typeof DeleteInventoryItemSchema>

export async function deleteInventoryItem(
  input: DeleteInventoryItemInput
): Promise<{ error?: string; success?: boolean }> {
  console.log('[deleteInventoryItem] Input:', input)

  const parsed = DeleteInventoryItemSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[deleteInventoryItem] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { id, organization_id } = parsed.data

  const supabase = await createClient()

  const access = await requireOrgAccess(organization_id, ['owner', 'admin'], supabase)
  if (!access.success) return { error: access.error }

  const { error: deleteError } = await supabase
    .from('inventory_items')
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organization_id)

  if (deleteError) {
    console.error('[deleteInventoryItem] Delete error:', deleteError)
    return { error: 'Error al eliminar el producto. Intenta de nuevo.' }
  }

  console.log('[deleteInventoryItem] Item deleted successfully:', id)

  revalidatePath('/inventario')
  revalidatePath('/dashboard')

  return { success: true }
}

export type DeleteInventoryItemFormState = {
  success: boolean
  error?: string
}

export async function deleteInventoryItemForm(
  prevState: DeleteInventoryItemFormState,
  formData: FormData
): Promise<DeleteInventoryItemFormState> {
  const rawData = {
    id: formData.get('id') as string,
    organization_id: formData.get('organization_id') as string,
  }

  const parsed = DeleteInventoryItemSchema.safeParse(rawData)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message
    return { success: false, error: firstError || 'Datos inválidos' }
  }

  const result = await deleteInventoryItem(parsed.data)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}
