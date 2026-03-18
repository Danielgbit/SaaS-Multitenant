'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateInventoryItemSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
  organization_id: z.string().uuid('ID de organización inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  sku: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  category: z.string().max(50).optional().or(z.literal('')),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  min_quantity: z.number().int().min(0),
  price: z.number().positive('El precio debe ser positivo').optional().nullable(),
  cost_price: z.number().positive('El costo debe ser positivo').optional().nullable(),
  unit: z.string().max(20),
})

type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>

export async function updateInventoryItem(
  input: UpdateInventoryItemInput
): Promise<{ error?: string; success?: boolean }> {
  console.log('[updateInventoryItem] Input:', input)

  const parsed = UpdateInventoryItemSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[updateInventoryItem] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { id, organization_id, name, sku, description, category, quantity, min_quantity, price, cost_price, unit } = parsed.data

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
      name: name.trim(),
      sku: sku || null,
      description: description || null,
      category: category || null,
      quantity,
      min_quantity,
      price,
      cost_price,
      unit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organization_id)

  if (updateError) {
    console.error('[updateInventoryItem] Update error:', updateError)
    return { error: 'Error al actualizar el producto. Intenta de nuevo.' }
  }

  console.log('[updateInventoryItem] Item updated successfully:', id)

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { success: true }
}

export type UpdateInventoryItemFormState = {
  success: boolean
  error?: string
  fieldErrors?: {
    name?: string[]
    sku?: string[]
    description?: string[]
    category?: string[]
    quantity?: string[]
    min_quantity?: string[]
    price?: string[]
    cost_price?: string[]
    unit?: string[]
  }
}

export async function updateInventoryItemForm(
  prevState: UpdateInventoryItemFormState,
  formData: FormData
): Promise<UpdateInventoryItemFormState> {
  const rawData = {
    id: formData.get('id') as string,
    organization_id: formData.get('organization_id') as string,
    name: formData.get('name') as string,
    sku: formData.get('sku') as string | undefined,
    description: formData.get('description') as string | undefined,
    category: formData.get('category') as string | undefined,
    quantity: formData.get('quantity') ? parseInt(formData.get('quantity') as string) : 0,
    min_quantity: formData.get('min_quantity') ? parseInt(formData.get('min_quantity') as string) : 5,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
    cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price') as string) : undefined,
    unit: formData.get('unit') as string,
  }

  const parsed = UpdateInventoryItemSchema.safeParse(rawData)

  if (!parsed.success) {
    const fieldErrors: UpdateInventoryItemFormState['fieldErrors'] = {}
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as keyof typeof fieldErrors
      if (path && path in fieldErrors) {
        if (!fieldErrors[path]) {
          fieldErrors[path] = []
        }
        fieldErrors[path]!.push(issue.message)
      }
    })
    return { success: false, fieldErrors }
  }

  const result = await updateInventoryItem(parsed.data)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}
