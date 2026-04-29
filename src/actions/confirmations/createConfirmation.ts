'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ServiceItemSchema = z.object({
  service_id: z.string(),
  service_name: z.string(),
  price: z.number(),
  performed: z.boolean(),
})

const CreateConfirmationSchema = z.object({
  organization_id: z.string().uuid('ID de organización inválido'),
  employee_id: z.string().uuid('ID de empleado inválido'),
  appointment_id: z.string().uuid().optional(),
  services: z.array(ServiceItemSchema).min(1, 'Selecciona al menos un servicio'),
  confirmation_type: z.enum(['scheduled', 'walkin']),
  client_name: z.string().optional(),
  client_phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function createConfirmation(
  input: z.infer<typeof CreateConfirmationSchema>
): Promise<{ error?: string; success?: boolean; confirmationId?: string }> {
  console.log('[createConfirmation] Input:', input)

  const parsed = CreateConfirmationSchema.safeParse(input)

  if (!parsed.success) {
    console.log('[createConfirmation] Validation failed:', parsed.error.issues)
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { organization_id, employee_id, appointment_id, services, confirmation_type, client_name, client_phone, notes } = parsed.data

  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('[createConfirmation] Auth error:', authError)
    return { error: 'No autorizado.' }
  }

  // Verificar que el usuario pertenece a la organización
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  // Verificar que el employee_id pertenece a la organización
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', employee_id)
    .eq('organization_id', organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'Empleado no encontrado.' }
  }

  // Calcular total
  const performedServices = services.filter(s => s.performed)
  const total = performedServices.reduce((sum, s) => sum + s.price, 0)

  // Si es walkin, necesita cliente
  if (confirmation_type === 'walkin' && !client_name) {
    return { error: 'Para walk-in, ingresa el nombre del cliente.' }
  }

  // Si tiene appointment_id, obtener client_name desde el appointment
  let finalClientName = client_name
  let finalClientPhone = client_phone

  if (appointment_id) {
    const { data: appointmentData } = await supabase
      .from('appointments')
      .select('clients(name, phone)')
      .eq('id', appointment_id)
      .single()

    if (appointmentData?.clients) {
      finalClientName = (appointmentData.clients as any).name || client_name
      finalClientPhone = (appointmentData.clients as any).phone || client_phone
    }
  }

  // Insertar confirmación
  const { data: confirmation, error: insertError } = await (supabase as any)
    .from('appointment_confirmations')
    .insert({
      organization_id,
      employee_id,
      appointment_id: appointment_id || null,
      services: services,
      total_amount: total,
      confirmation_type,
      status: 'pending_reception',
      employee_confirmed_at: new Date().toISOString(),
      client_name: finalClientName || null,
      client_phone: finalClientPhone || null,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[createConfirmation] Insert error:', insertError)
    return { error: 'Error al confirmar servicios. Intenta de nuevo.' }
  }

  console.log('[createConfirmation] Confirmation created:', confirmation.id)

  // Actualizar el status del appointment si existe
  if (appointment_id) {
    const { error: aptError } = await (supabase as any)
      .from('appointments')
      .update({
        status: 'completed',
        confirmation_status: 'completed',
      })
      .eq('id', appointment_id)

    if (aptError) {
      console.error('[createConfirmation] Appointment update error:', aptError)
    }
  }

  // Revalidar paths
  revalidatePath('/dashboard/confirmations/employee')
  revalidatePath('/dashboard/confirmations/reception')
  revalidatePath('/dashboard/my-services')
  revalidatePath('/payroll')

  return { success: true, confirmationId: confirmation.id }
}

// Para usar con useFormState
export type CreateConfirmationFormState = {
  success: boolean
  error?: string
}

export async function createConfirmationForm(
  prevState: CreateConfirmationFormState,
  formData: FormData
): Promise<CreateConfirmationFormState> {
  try {
    const servicesJson = formData.get('services') as string
    const services = JSON.parse(servicesJson)

    const input = {
      organization_id: formData.get('organization_id') as string,
      employee_id: formData.get('employee_id') as string,
      appointment_id: formData.get('appointment_id') as string || undefined,
      services,
      confirmation_type: formData.get('confirmation_type') as 'scheduled' | 'walkin',
      client_name: formData.get('client_name') as string || undefined,
      client_phone: formData.get('client_phone') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    const result = await createConfirmation(input)

    if (result.error) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (e) {
    console.error('[createConfirmationForm] Error:', e)
    return { success: false, error: 'Error al procesar la solicitud.' }
  }
}
