'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { z } from 'zod'
import { captureError } from '@/lib/error-logger'
import { recordInventoryMovement } from '@/lib/inventory/inventory-movement'

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

export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>

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

  const access = await requireOrgAccess(organization_id, ['owner', 'admin'], supabase)
  if (!access.success) return { error: access.error }

  const { data: currentItem, error: fetchError } = await supabase
    .from('inventory_items')
    .select('id, quantity')
    .eq('id', id)
    .eq('organization_id', organization_id)
    .single()

  if (fetchError || !currentItem) {
    captureError('inventory_update_fetch_error', fetchError, { organization_id, itemId: id })
    return { error: 'Producto no encontrado.' }
  }

  const quantityBefore = currentItem.quantity
  const quantityChange = quantity - quantityBefore

  if (quantityChange !== 0) {
    const movementResult = await recordInventoryMovement({
      inventoryItemId: id,
      organizationId: organization_id,
      movementType: 'adjustment',
      quantityChange,
      quantityBefore,
      quantityAfter: quantity,
      reason: 'Stock actualizado manualmente',
      createdBy: access.context.userId,
    })

    if (!movementResult.success) {
      captureError('inventory_update_movement_failed', new Error('Failed to record adjustment movement'), {
        organization_id,
        itemId: id,
        quantityBefore,
        quantityAfter: quantity,
      })
      return { error: 'Error al registrar el movimiento de inventario. No se actualizó el stock.' }
    }
  }

  const { error: updateError } = await supabase
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
    captureError('inventory_update_error', updateError, { organization_id })
    return { error: 'Error al actualizar el producto. Intenta de nuevo.' }
  }

  console.log('[updateInventoryItem] Item updated successfully:', id)

  revalidatePath('/inventario')
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
