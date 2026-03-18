'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getInventoryCount } from './getInventoryItems'

const CreateInventoryItemSchema = z.object({
  organization_id: z.string().uuid('ID de organización inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  sku: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  category: z.string().max(50).optional().or(z.literal('')),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa').default(0),
  min_quantity: z.number().int().min(0).default(5),
  price: z.number().positive('El precio debe ser positivo').optional().nullable(),
  cost_price: z.number().positive('El costo debe ser positivo').optional().nullable(),
  unit: z.string().max(20).default('pieza'),
})

type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>

async function getPlanLimit(supabase: any, organizationId: string): Promise<number> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('organization_id', organizationId)
    .single()

  if (!subscription) return 200

  const { data: plan } = await supabase
    .from('plans')
    .select('max_inventory_items')
    .eq('id', subscription.plan_id)
    .single()

  return plan?.max_inventory_items || 200
}

export async function createInventoryItem(
  input: CreateInventoryItemInput
): Promise<{ error?: string; success?: boolean; itemId?: string }> {
  console.log('[createInventoryItem] Input:', input)

  const parsed = CreateInventoryItemSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[createInventoryItem] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { organization_id, name, sku, description, category, quantity, min_quantity, price, cost_price, unit } = parsed.data

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('[createInventoryItem] Auth error:', authError)
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

  const currentCount = await getInventoryCount(organization_id)
  const limit = await getPlanLimit(supabase, organization_id)

  if (currentCount >= limit) {
    return { error: `Límite alcanzado. Máximo ${limit} productos en tu plan.` }
  }

  const { data: item, error: insertError } = await (supabase as any)
    .from('inventory_items')
    .insert({
      organization_id,
      name: name.trim(),
      sku: sku || null,
      description: description || null,
      category: category || null,
      quantity,
      min_quantity,
      price,
      cost_price,
      unit,
      active: true,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[createInventoryItem] Insert error:', insertError)
    return { error: 'Error al crear el producto. Intenta de nuevo.' }
  }

  console.log('[createInventoryItem] Item created successfully:', item.id)

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { success: true, itemId: item.id }
}

export type CreateInventoryItemFormState = {
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

export async function createInventoryItemForm(
  prevState: CreateInventoryItemFormState,
  formData: FormData
): Promise<CreateInventoryItemFormState> {
  const rawData = {
    organization_id: formData.get('organization_id') as string,
    name: formData.get('name') as string,
    sku: formData.get('sku') as string | undefined,
    description: formData.get('description') as string | undefined,
    category: formData.get('category') as string | undefined,
    quantity: formData.get('quantity') ? parseInt(formData.get('quantity') as string) : 0,
    min_quantity: formData.get('min_quantity') ? parseInt(formData.get('min_quantity') as string) : 5,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
    cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price') as string) : undefined,
    unit: formData.get('unit') as string | undefined,
  }

  const parsed = CreateInventoryItemSchema.safeParse(rawData)

  if (!parsed.success) {
    const fieldErrors: CreateInventoryItemFormState['fieldErrors'] = {}
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

  const result = await createInventoryItem(parsed.data)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}
