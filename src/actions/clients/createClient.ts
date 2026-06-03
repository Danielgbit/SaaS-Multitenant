'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { isValidPhone, getPhoneErrorMessage, normalizePhone, normalizeEmail } from '@/lib/validators/phone'
import { devLog, devError } from '@/lib/logger'

const CreateClientSchema = z.object({
  organization_id: z.string().uuid('ID de organización inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  confirmation_method: z.enum(['whatsapp', 'phone_call', 'in_person', 'none']).default('whatsapp'),
  confirmations_enabled: z.boolean().default(true),
  preferred_contact: z.enum(['whatsapp', 'phone', 'email']).optional().nullable(),
})

type CreateClientInput = z.infer<typeof CreateClientSchema>

export async function createClientAction(
  input: CreateClientInput
): Promise<{ error?: string; success?: boolean; clientId?: string }> {
  const parsed = CreateClientSchema.safeParse(input)

  if (!parsed.success) {
    devLog('[createClient] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { 
    organization_id, 
    name, 
    email, 
    notes,
    confirmation_method,
    confirmations_enabled,
    preferred_contact
  } = parsed.data

  const normalizedPhone = normalizePhone(parsed.data.phone ?? '')
  const normalizedEmail = normalizeEmail(parsed.data.email ?? '')

  if (normalizedPhone && !isValidPhone(normalizedPhone)) {
    const phoneError = getPhoneErrorMessage(normalizedPhone)
    return { error: phoneError || 'El teléfono no es válido' }
  }

  const supabase = await createSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    devLog('[createClient] Auth error:', authError)
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

  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      organization_id,
      name,
      phone: normalizedPhone || null,
      email: normalizedEmail || null,
      notes: notes || null,
      confirmation_method,
      confirmations_enabled,
      preferred_contact: preferred_contact || 'whatsapp',
    })
    .select('id')
    .single()

  if (insertError) {
    devError('[createClient] Insert error:', insertError)
    return { error: 'Error al crear el cliente. Intenta de nuevo.' }
  }

  devLog('[createClient] Client created:', client.id)

  revalidatePath('/clients')
  revalidatePath('/calendar')
  
  try {
    revalidateTag('clients', 'max')
  } catch (e) {
    devLog('[createClient] revalidateTag error:', e)
  }

  return { success: true, clientId: client.id }
}

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
    confirmation_method: (formData.get('confirmation_method') as string) || 'whatsapp',
    confirmations_enabled: formData.get('confirmations_enabled') === 'true',
    preferred_contact: (formData.get('preferred_contact') as string) || 'whatsapp',
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

  const { phone } = parsed.data
  
  if (phone && !isValidPhone(phone)) {
    const phoneError = getPhoneErrorMessage(phone)
    return { success: false, fieldErrors: { phone: [phoneError || 'Teléfono inválido'] } }
  }

  const result = await createClientAction(parsed.data)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}
