'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { isValidPhone, getPhoneErrorMessage } from '@/lib/validators/phone'

const UpdateClientSchema = z.object({
  id: z.string().uuid('ID de cliente inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  organization_id: z.string().uuid('ID de organización inválido'),
  confirmation_method: z.enum(['whatsapp', 'phone_call', 'in_person', 'none']).optional(),
  confirmations_enabled: z.boolean().optional(),
  preferred_contact: z.enum(['whatsapp', 'phone', 'email']).optional().nullable(),
})

interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function updateClient(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado' }
  }

  const rawData = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    organization_id: formData.get('organization_id') as string,
    confirmation_method: (formData.get('confirmation_method') as string) || undefined,
    confirmations_enabled: formData.get('confirmations_enabled') === 'true' ? true : 
                           formData.get('confirmations_enabled') === 'false' ? false : undefined,
    preferred_contact: (formData.get('preferred_contact') as string) || undefined,
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

  const { 
    id, 
    name, 
    email, 
    phone, 
    notes, 
    organization_id,
    confirmation_method,
    confirmations_enabled,
    preferred_contact
  } = parsed.data

  if (phone && !isValidPhone(phone)) {
    const phoneError = getPhoneErrorMessage(phone)
    return { success: false, fieldErrors: { phone: [phoneError || 'Teléfono inválido'] } }
  }

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

  const updateData: Record<string, unknown> = {
    name,
    email: email || null,
    phone: phone || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }

  if (confirmation_method !== undefined) {
    updateData.confirmation_method = confirmation_method
  }

  if (confirmations_enabled !== undefined) {
    updateData.confirmations_enabled = confirmations_enabled
  }

  if (preferred_contact !== undefined) {
    updateData.preferred_contact = preferred_contact
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)

  if (updateError) {
    return { success: false, error: 'Error al actualizar el cliente' }
  }

  revalidatePath('/clients')

  return { success: true }
}
