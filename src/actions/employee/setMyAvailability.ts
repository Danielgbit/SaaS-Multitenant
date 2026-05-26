'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type DaySlot = {
  day_of_week: number
  start_time: string
  end_time: string
}

export async function setMyAvailability(input: { availability: DaySlot[] }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) return { error: 'No tienes un perfil de empleado vinculado.' }

  // Validate
  for (const slot of input.availability) {
    if (slot.day_of_week < 0 || slot.day_of_week > 6)
      return { error: `Día inválido: ${slot.day_of_week}` }
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(slot.start_time))
      return { error: `Formato de hora inválido: ${slot.start_time}` }
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(slot.end_time))
      return { error: `Formato de hora inválido: ${slot.end_time}` }
    if (slot.start_time >= slot.end_time)
      return { error: 'La hora de inicio debe ser menor que la de fin.' }
  }

  // Replace all availability for this employee
  await supabase.from('employee_availability').delete().eq('employee_id', employee.id)

  if (input.availability.length > 0) {
    const { error } = await supabase.from('employee_availability').insert(
      input.availability.map((s) => ({
        employee_id: employee.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      }))
    )
    if (error) {
      console.error('Error saving availability:', error.message)
      return { error: 'No se pudo guardar la disponibilidad.' }
    }
  }

  revalidatePath('/mi')
  return { success: true }
}
