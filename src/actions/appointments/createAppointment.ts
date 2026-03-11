'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateSlots } from '@/services/slots/generateSlots'

// =============================================================================
// SCHEMA DE VALIDACIÓN
// =============================================================================

const CreateAppointmentSchema = z.object({
  employee_id: z.string().uuid('ID de empleado inválido'),
  client_id: z.string().uuid('ID de cliente inválido'),
  service_id: z.string().uuid('ID de servicio inválido'),
  start_time: z.string().datetime('Fecha inválida'),
  organization_id: z.string().uuid('ID de organización inválido'),
  notes: z.string().optional(),
})

type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>

// =============================================================================
// SERVER ACTION
// =============================================================================

/**
 * Crea una nueva cita verificando disponibilidad antes de insertar.
 * 
 * @param input - Datos de la cita a crear
 * @returns Error si falla, success si se crea correctamente
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<{ error?: string; success?: boolean; appointmentId?: string }> {
  // 1. Validar input con Zod
  const parsed = CreateAppointmentSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { employee_id, client_id, service_id, start_time, organization_id, notes } = parsed.data

  const supabase = await createClient()

  // 2. Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // 3. Verificar que el usuario pertenece a la organización
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  // 4. Verificar que el empleado existe y pertenece a la org
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id, active')
    .eq('id', employee_id)
    .eq('organization_id', organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no existe o no pertenece a tu organización.' }
  }

  if (!employee.active) {
    return { error: 'El empleado no está activo.' }
  }

  // 5. Verificar que el cliente existe y pertenece a la org
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, organization_id')
    .eq('id', client_id)
    .eq('organization_id', organization_id)
    .single()

  if (clientError || !client) {
    return { error: 'El cliente no existe o no pertenece a tu organización.' }
  }

  // 6. Obtener duración del servicio
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration, active')
    .eq('id', service_id)
    .eq('organization_id', organization_id)
    .single()

  if (serviceError || !service) {
    return { error: 'El servicio no existe o no pertenece a tu organización.' }
  }

  if (!service.active) {
    return { error: 'El servicio no está activo.' }
  }

  // 7. Calcular hora de fin
  const startDate = new Date(start_time)
  const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000)

  // 8. VERIFICAR DISPONIBILIDAD (prevenir race conditions)
  // Obtenemos los slots disponibles para esa fecha
  const dateStr = start_time.split('T')[0]

  try {
    const availableSlots = await generateSlots({
      employeeId: employee_id,
      serviceId: service_id,
      date: dateStr,
      organizationId: organization_id,
    })

    // Buscar si el slot solicitado está disponible
    const slotAvailable = availableSlots.some(
      (slot) =>
        slot.available &&
        new Date(slot.start_time).getTime() === startDate.getTime()
    )

    if (!slotAvailable) {
      return { error: 'El horario ya no está disponible. Por favor selecciona otro.' }
    }
  } catch (genError) {
    console.error('Error verifying slot availability:', genError)
    return { error: 'Error al verificar disponibilidad.' }
  }

  // 9. Crear la cita (dentro de transaction implícita)
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      organization_id,
      client_id,
      employee_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: 'pending',
      notes: notes || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating appointment:', insertError)
    return { error: 'Error al crear la cita. Intenta de nuevo.' }
  }

  // 10. Crear la relación appointment_services
  const { error: relationError } = await supabase
    .from('appointment_services')
    .insert({
      appointment_id: appointment.id,
      service_id,
    })

  if (relationError) {
    console.error('Error creating appointment_service relation:', relationError)
    // No fallamos por esto, la cita ya fue creada
  }

  // 11. Revalidar paths relevantes
  revalidatePath('/calendar')
  revalidatePath('/employees')

  return { success: true, appointmentId: appointment.id }
}

// =============================================================================
// ACTUALIZAR STATUS
// =============================================================================

const UpdateStatusSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
  status: z.enum(['pending', 'confirmed', 'completed', 'canceled', 'no_show']),
})

export async function updateAppointmentStatus(
  input: z.infer<typeof UpdateStatusSchema>
): Promise<{ error?: string; success?: boolean }> {
  const parsed = UpdateStatusSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Datos inválidos' }
  }

  const { appointment_id, status } = parsed.data

  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // Verificar pertenencia a la organización
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select('organization_id')
    .eq('id', appointment_id)
    .single()

  if (aptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (!orgMember) {
    return { error: 'No perteneces a esta organización.' }
  }

  // Actualizar status
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointment_id)

  if (updateError) {
    console.error('Error updating appointment:', updateError)
    return { error: 'Error al actualizar la cita.' }
  }

  revalidatePath('/calendar')
  revalidatePath('/employees')

  return { success: true }
}
