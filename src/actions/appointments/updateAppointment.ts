'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateSlots } from '@/services/slots/generateSlots'
import { Database } from '@db/supabase'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const UpdateAppointmentSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
  employee_id: z.string().uuid('ID de empleado inválido').optional(),
  client_id: z.string().uuid('ID de cliente inválido').optional(),
  service_id: z.string().uuid('ID de servicio inválido').optional(),
  start_time: z.string().min(1, 'Fecha inválida').optional(),
  notes: z.string().optional(),
  ignoreAvailability: z.boolean().optional(),
})

export async function updateAppointment(
  input: unknown
): Promise<{ error?: string; success?: boolean; warning?: string; code?: string }> {
  const parsed = UpdateAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointment_id, employee_id, client_id, service_id, start_time, notes, ignoreAvailability } = parsed.data
  const supabase = await createClient()

  const { data: currentAppointment, error: aptError } = await supabase
    .from('appointments')
    .select('*, services:appointment_services(*)')
    .eq('id', appointment_id)
    .single()

  if (aptError || !currentAppointment) return { error: 'Cita no encontrada.' }

  const access = await requireOrgAccess(currentAppointment.organization_id, ['owner', 'staff', 'admin'])
  if (!access.success) return { error: access.error }

  const updateData: Database['public']['Tables']['appointments']['Update'] = {}
  let warning: string | undefined

  if (employee_id && employee_id !== currentAppointment.employee_id) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, active')
      .eq('id', employee_id)
      .eq('organization_id', currentAppointment.organization_id)
      .single()

    if (!employee || !employee.active) return { error: 'El empleado no existe o no está activo.' }
    updateData.employee_id = employee_id
  }

  if (client_id && client_id !== currentAppointment.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('organization_id', currentAppointment.organization_id)
      .single()

    if (!client) return { error: 'El cliente no existe.' }
    updateData.client_id = client_id
  }

  if (service_id) {
    const { data: service } = await supabase
      .from('services')
      .select('id, duration, active')
      .eq('id', service_id)
      .eq('organization_id', currentAppointment.organization_id)
      .single()

    if (!service || !service.active) return { error: 'El servicio no existe o no está activo.' }

    const aptServices = currentAppointment as any
    const currentServiceId = aptServices.appointment_services?.[0]?.service_id
    if (service_id !== currentServiceId) {
      await supabase.from('appointment_services').delete().eq('appointment_id', appointment_id)
      await supabase.from('appointment_services').insert({ appointment_id, service_id })
    }

    if (start_time) {
      const startDate = new Date(start_time)
      const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000)
      updateData.start_time = startDate.toISOString()
      updateData.end_time = endDate.toISOString()
    }
  }

  if (notes !== undefined) updateData.notes = notes

  if (Object.keys(updateData).length === 0) return { success: true }

  if (start_time && start_time !== currentAppointment.start_time && !ignoreAvailability) {
    const empId = employee_id || currentAppointment.employee_id
    const aptServices = currentAppointment as any
    const srvId = service_id || aptServices.appointment_services?.[0]?.service_id

    if (empId && srvId) {
      const dateStr = start_time.split('T')[0]
      const slots = await generateSlots({
        employeeId: empId, serviceId: srvId, date: dateStr, organizationId: currentAppointment.organization_id,
      })

      const startDate = new Date(start_time)
      const slotAvailable = slots.some((slot) => slot.available && new Date(slot.start_time).getTime() === startDate.getTime())

      if (!slotAvailable) return { error: 'El horario no está disponible.', code: 'SLOT_UNAVAILABLE' }

      const originalStart = new Date(currentAppointment.start_time).getTime()
      if (startDate.getTime() !== originalStart) warning = 'El horario de la cita ha cambiado.'
    }
  }

  const { error: updateError } = await supabase.from('appointments').update(updateData).eq('id', appointment_id)

  if (updateError) {
    console.error('Error updating appointment:', updateError)
    return { error: 'Error al actualizar la cita.' }
  }

  revalidatePath('/calendar')
  revalidatePath('/employees')

  return { success: true, warning }
}
