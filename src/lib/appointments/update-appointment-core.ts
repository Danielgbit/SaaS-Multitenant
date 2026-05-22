import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// SCHEMA
// =============================================================================

export const UpdateStatusSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
  status: z.enum(['pending', 'confirmed', 'completed', 'canceled', 'no_show']),
})

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>

// =============================================================================
// VALIDATE INPUT
// =============================================================================

export function validateUpdateStatusInput(input: unknown) {
  const parsed = UpdateStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: 'Datos inválidos' }
  }
  return { success: true as const, data: parsed.data }
}

// =============================================================================
// CHECK PRECONDITIONS
// =============================================================================

export interface UpdateStatusPreconditionResult {
  organization_id: string
  created_at: string
  status: string
  confirmation_status: string | null
  orgMember: { role: string }
}

export async function checkUpdateStatusPreconditions(
  supabase: SupabaseClient,
  appointmentId: string,
  userId: string
): Promise<
  { success: true; data: UpdateStatusPreconditionResult }
  | { success: false; error: string; statusCode?: number }
> {
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select('organization_id, status, confirmation_status, created_at')
    .eq('id', appointmentId)
    .single()

  if (aptError || !appointment) {
    return { success: false, error: 'Cita no encontrada.', statusCode: 404 }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (!orgMember) {
    return { success: false, error: 'No perteneces a esta organización.', statusCode: 403 }
  }

  if (orgMember.role === 'empleado') {
    return { success: false, error: 'No tienes permisos para cambiar el estado de esta cita.', statusCode: 403 }
  }

  return {
    success: true,
    data: {
      organization_id: appointment.organization_id,
      created_at: appointment.created_at,
      status: appointment.status,
      confirmation_status: appointment.confirmation_status,
      orgMember,
    },
  }
}

// =============================================================================
// UPDATE STATUS
// =============================================================================

export async function updateAppointmentStatusInDb(
  supabase: SupabaseClient,
  appointmentId: string,
  status: string
): Promise<{ error?: string }> {
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('Error updating appointment:', updateError)
    return { error: 'Error al actualizar la cita.' }
  }

  return {}
}
