'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =============================================================================
// ESQUEMAS DE VALIDACIÓN (Zod)
// =============================================================================

const UpdateClientSchema = z.object({
  id: z.string().uuid('ID de cliente inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  organization_id: z.string().uuid('ID de organización inválido'),
})

type UpdateClientInput = z.infer<typeof UpdateClientSchema>

// =============================================================================
// TIPOS DE RESPUESTA
// =============================================================================

interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// =============================================================================
// SERVER ACTION: Actualizar Cliente
// =============================================================================

export async function updateClient(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  // 1. Validar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado' }
  }

  // 2. Extraer y validar datos
  const rawData = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    organization_id: formData.get('organization_id') as string,
  }

  const parsed = UpdateClientSchema.safeParse(rawData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    parsed.error.issues.forEach((err) => {
      const field = err.path[0] as string
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(err.message)
    })
    return { success: false, fieldErrors }
  }

  const { id, name, email, phone, notes, organization_id } = parsed.data

  // 3. Verificar permisos (pertenece a la organización)
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('organization_id')
    .eq('id', id)
    .single()

  if (fetchError || !client) {
    return { success: false, error: 'Cliente no encontrado' }
  }

  if (client.organization_id !== organization_id) {
    return { success: false, error: 'No tienes permisos para editar este cliente' }
  }

  // 4. Actualizar cliente
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return { success: false, error: 'Error al actualizar el cliente' }
  }

  // 5. Revalidar caché
  revalidatePath('/clients')

  return { success: true }
}
