'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =============================================================================
// SCHEMA DE VALIDACIÓN
// =============================================================================

const CreateClientSchema = z.object({
  organization_id: z.string().uuid('ID de organización inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

type CreateClientInput = z.infer<typeof CreateClientSchema>

// =============================================================================
// SERVER ACTION
// =============================================================================

/**
 * Crea un nuevo cliente.
 */
export async function createClientAction(
  input: CreateClientInput
): Promise<{ error?: string; success?: boolean; clientId?: string }> {
  console.log('[createClient] Input:', input)
  
  // 1. Validar input
  const parsed = CreateClientSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[createClient] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { organization_id, name, phone, email, notes } = parsed.data

  const supabase = await createSupabaseClient()

  // 2. Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('[createClient] Auth error:', authError)
    return { error: 'No autorizado.' }
  }

  // 3. Verificar que el usuario pertenece a la organización
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  // 4. Crear el cliente
  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      organization_id,
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[createClient] Insert error:', insertError)
    return { error: 'Error al crear el cliente. Intenta de nuevo.' }
  }

  console.log('[createClient] Client created successfully:', client.id)

  // 5. Revalidar paths - Force refresh
  revalidatePath('/clients')
  revalidatePath('/calendar')
  
  // Also try revalidateTag if available
  try {
    // @ts-expect-error - revalidateTag signature may vary
    revalidateTag('clients')
  } catch (e) {
    // revalidateTag may not be available in all Next.js versions or has different signature
    console.log('[createClient] revalidateTag not available or error:', e)
  }

  return { success: true, clientId: client.id }
}

// =============================================================================
// FORMWRAPPER - Para usar con useFormState
// =============================================================================

export type CreateClientFormState = {
  success: boolean
  error?: string
  fieldErrors?: {
    name?: string[]
    email?: string[]
    phone?: string[]
    notes?: string[]
  }
}

/**
 * Wrapper para usar con useFormState. Acepta FormData.
 */
export async function createClient(
  prevState: CreateClientFormState,
  formData: FormData
): Promise<CreateClientFormState> {
  const rawData = {
    organization_id: formData.get('organization_id') as string,
    name: formData.get('name') as string,
    phone: formData.get('phone') as string | undefined,
    email: formData.get('email') as string | undefined,
    notes: formData.get('notes') as string | undefined,
  }

  const parsed = CreateClientSchema.safeParse(rawData)

  if (!parsed.success) {
    const fieldErrors: CreateClientFormState['fieldErrors'] = {}
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

  const result = await createClientAction(parsed.data)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}
