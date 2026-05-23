'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autorizado.' }

  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select('organization_id')
    .eq('id', appointment_id)
    .single()

  if (aptError || !appointment) return { error: 'Cita no encontrada.' }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (!orgMember || (orgMember.role !== 'owner' && orgMember.role !== 'staff' && orgMember.role !== 'admin')) {
    return { error: 'No tienes permisos para eliminar esta cita.' }
  }

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
