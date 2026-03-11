'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =============================================================================
// ESQUEMAS DE VALIDACIÓN (Zod)
// =============================================================================

const DeleteClientSchema = z.object({
  id: z.string().uuid('ID de cliente inválido'),
  organization_id: z.string().uuid('ID de organización inválido'),
})

type DeleteClientInput = z.infer<typeof DeleteClientSchema>

// =============================================================================
// TIPOS DE RESPUESTA
// =============================================================================

interface ActionResult {
  success: boolean
  error?: string
}

// =============================================================================
// SERVER ACTION: Eliminar Cliente
// =============================================================================

export async function deleteClient(
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
    organization_id: formData.get('organization_id') as string,
  }

  const parsed = DeleteClientSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { id, organization_id } = parsed.data

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
    return { success: false, error: 'No tienes permisos para eliminar este cliente' }
  }

  // 4. Verificar si tiene citas asociadas
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id')
    .eq('client_id', id)
    .limit(1)

  if (!appointmentsError && appointments && appointments.length > 0) {
    return { 
      success: false, 
      error: 'No se puede eliminar un cliente con citas asociadas. Considera marcarlo como inactivo.' 
    }
  }

  // 5. Eliminar cliente
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { success: false, error: 'Error al eliminar el cliente' }
  }

  // 6. Revalidar caché
  revalidatePath('/clients')

  return { success: true }
}
