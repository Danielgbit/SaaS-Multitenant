import { z } from 'zod'
import { generateSlots } from '@/services/slots/generateSlots'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// SCHEMAS
// =============================================================================

export const CreateAppointmentSchema = z.object({
  employee_id: z.string().uuid('ID de empleado inválido'),
  client_id: z.string().uuid('ID de cliente inválido'),
  service_id: z.string().uuid('ID de servicio inválido'),
  start_time: z.string().min(1, 'Fecha inválida'),
  organization_id: z.string().uuid('ID de organización inválido'),
  notes: z.string().optional(),
})

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>

// =============================================================================
// VALIDATE INPUT
// =============================================================================

export function validateCreateInput(input: unknown) {
  const parsed = CreateAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }
  return { success: true as const, data: parsed.data }
}

// =============================================================================
// CHECK PRECONDITIONS
// =============================================================================

export interface PreconditionResult {
  service: { id: string; name: string; duration: number; active: boolean; price: number }
}

export async function checkCreatePreconditions(
  supabase: SupabaseClient,
  input: CreateAppointmentInput
): Promise<{ success: true; data: PreconditionResult } | { success: false; error: string }> {
  const { employee_id, client_id, service_id, organization_id } = input

  const employeePromise = supabase
    .from('employees')
    .select('id, organization_id, active')
    .eq('id', employee_id)
    .eq('organization_id', organization_id)
    .single()

  const clientPromise = supabase
    .from('clients')
    .select('id, organization_id')
    .eq('id', client_id)
    .eq('organization_id', organization_id)
    .single()

  const servicePromise = supabase
    .from('services')
    .select('id, name, duration, active, price')
    .eq('id', service_id)
    .eq('organization_id', organization_id)
    .single()

  const [empRes, cliRes, srvRes] = await Promise.all([employeePromise, clientPromise, servicePromise])

  if (empRes.error || !empRes.data) {
    return { success: false, error: 'El empleado no existe o no pertenece a tu organización.' }
  }
  if (!empRes.data.active) {
    return { success: false, error: 'El empleado no está activo.' }
  }

  if (cliRes.error || !cliRes.data) {
    return { success: false, error: 'El cliente no existe o no pertenece a tu organización.' }
  }

  if (srvRes.error || !srvRes.data) {
    return { success: false, error: 'El servicio no existe o no pertenece a tu organización.' }
  }
  if (!srvRes.data.active) {
    return { success: false, error: 'El servicio no está activo.' }
  }

  return { success: true, data: { service: srvRes.data } }
}

// =============================================================================
// COMPUTE TIME
// =============================================================================

export function computeAppointmentTimes(startTime: string, durationMinutes: number) {
  const normalizedStart = startTime.endsWith('Z') ? startTime.slice(0, -1) : startTime
  const startDate = new Date(normalizedStart)
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
  return { startDate, endDate, normalizedStart }
}

// =============================================================================
// VERIFY SLOT AVAILABILITY
// =============================================================================

export interface SlotVerificationOptions {
  bypassNotice?: boolean
}

export async function verifySlotAvailability(
  supabase: SupabaseClient,
  employeeId: string,
  serviceId: string,
  startTime: string,
  organizationId: string,
  options?: SlotVerificationOptions
): Promise<{ success: true } | { success: false; error: string }> {
  const dateStr = startTime.split('T')[0]
  const normalizedStart = startTime.endsWith('Z') ? startTime.slice(0, -1) : startTime

  try {
    const availableSlots = await generateSlots({
      employeeId,
      serviceId,
      date: dateStr,
      organizationId,
      bypassNotice: options?.bypassNotice,
    })

    if (availableSlots.length === 0) {
      return {
        success: false,
        error: 'No hay horarios disponibles para este día. El empleado puede tener el día libre o el spa cerrado.',
      }
    }

    const slotAvailable = availableSlots.some(slot => {
      const slotNormalized = slot.start_time.endsWith('Z')
        ? slot.start_time.slice(0, -1)
        : slot.start_time
      return slot.available && slotNormalized === normalizedStart
    })

    if (!slotAvailable) {
      return {
        success: false,
        error: 'El horario seleccionado ya no está disponible. Por favor elige otro horario.',
      }
    }

    return { success: true }
  } catch (genError) {
    console.error('Error verifying slot availability:', genError)
    return { success: false, error: 'Error al verificar disponibilidad.' }
  }
}

// =============================================================================
// INSERT APPOINTMENT
// =============================================================================

export interface InsertAppointmentInput {
  organization_id: string
  client_id: string
  employee_id: string
  service_id: string
  start_time: string
  end_time: string
  notes: string | null
}

export async function insertAppointment(
  supabase: SupabaseClient,
  input: InsertAppointmentInput
): Promise<{ success: true; data: { id: string; start_time: string; end_time: string; status: string } } | { success: false; error: string }> {
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      organization_id: input.organization_id,
      client_id: input.client_id,
      employee_id: input.employee_id,
      start_time: input.start_time,
      end_time: input.end_time,
      status: 'pending',
      notes: input.notes || null,
    })
    .select('id, start_time, end_time, status')
    .single()

  if (insertError) {
    console.error('Error creating appointment:', insertError)
    return { success: false, error: 'Error al crear la cita. Intenta de nuevo.' }
  }

  const { error: relationError } = await supabase
    .from('appointment_services')
    .insert({ appointment_id: appointment.id, service_id: input.service_id })

  if (relationError) {
    console.error('Error creating appointment_service relation:', relationError)
  }

  return { success: true, data: appointment }
}
