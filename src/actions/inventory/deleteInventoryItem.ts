'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

  const { error: deleteError } = await (supabase as any)
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

  revalidatePath('/inventory')
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
