'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const DeleteAppointmentSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
})

export async function deleteAppointment(
  input: unknown
): Promise<{ error?: string; success?: boolean }> {
  const parsed = DeleteAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointment_id } = parsed.data
  const supabase = await createClient()

  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select('organization_id')
    .eq('id', appointment_id)
    .single()

  if (aptError || !appointment) return { error: 'Cita no encontrada.' }

  const access = await requireOrgAccess(appointment.organization_id, ['owner', 'staff', 'admin'])
  if (!access.success) return { error: access.error }

  await supabase.from('appointment_services').delete().eq('appointment_id', appointment_id)

  const { error: deleteError } = await supabase.from('appointments').delete().eq('id', appointment_id)

  if (deleteError) {
    console.error('Error deleting appointment:', deleteError)
    return { error: 'Error al eliminar la cita.' }
  }

  revalidatePath('/calendar')
  revalidatePath('/employees')

  return { success: true }
}
