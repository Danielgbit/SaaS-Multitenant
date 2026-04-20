'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MarkCompletedSchema, type MarkCompletedState } from './schemas'

export async function markCompleted(
  prevState: MarkCompletedState,
  formData: FormData
): Promise<MarkCompletedState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    priceAdjustment: formData.get('priceAdjustment') 
      ? Number(formData.get('priceAdjustment')) 
      : 0,
    notes: formData.get('notes') as string | undefined,
  }

  const parsed = MarkCompletedSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointmentId, priceAdjustment, notes } = parsed.data

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: appointment, error: apptError } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      organization_id,
      employee_id,
      start_time,
      end_time,
      status,
      confirmation_status,
      price_adjustment
    `)
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  if (appointment.confirmation_status === 'completed') {
    return { error: 'Esta cita ya fue marcada como completada.' }
  }

  if (appointment.confirmation_status === 'confirmed') {
    return { error: 'Esta cita ya fue confirmada.' }
  }

  const { data: employee, error: empError } = await (supabase as any)
    .from('employees')
    .select('id, user_id, name')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'No se encontró tu perfil de empleado.' }
  }

  if (employee.id !== appointment.employee_id) {
    return { error: 'Solo puedes marcar como completadas tus propias citas.' }
  }

  const now = new Date().toISOString()
  const basePrice = appointment.price_adjustment || 0
  const finalPrice = basePrice + (priceAdjustment || 0)

  const { data: log, error: logError } = await (supabase as any)
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'created',
      performed_by: user.id,
      performed_by_role: 'employee',
      price_before: basePrice,
      price_after: finalPrice,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('[markCompleted] Log error:', logError)
    return { error: 'Error al registrar la acción. Intenta de nuevo.' }
  }

  const { error: updateError } = await (supabase as any)
    .from('appointments')
    .update({
      confirmation_status: 'completed',
      completed_at: now,
      completed_by: user.id,
      price_adjustment: finalPrice,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[markCompleted] Update error:', updateError)
    return { error: 'Error al actualizar la cita. Intenta de nuevo.' }
  }

  const { data: assistants, error: asstError } = await (supabase as any)
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', appointment.organization_id)
    .in('role', ['owner', 'admin', 'staff'])

  if (!asstError && assistants && assistants.length > 0) {
    const notifications = assistants.map((a: { user_id: string }) => ({
      organization_id: appointment.organization_id,
      user_id: a.user_id,
      type: 'service_ready' as const,
      title: 'Servicio completado',
      message: `${employee.name} completó un servicio`,
      metadata: {
        appointment_id: appointmentId,
        employee_id: employee.id,
        employee_name: employee.name,
        log_id: log.id,
        price: finalPrice,
      },
    }))

    await (supabase as any)
      .from('notifications')
      .insert(notifications)
  }

  try {
    // @ts-ignore
    revalidateTag(`confirmations-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[markCompleted] revalidateTag error:', e)
  }
  try {
    // @ts-ignore
    revalidateTag(`pending-${appointment.organization_id}`)
  } catch (e) {
    console.warn('[markCompleted] revalidateTag error:', e)
  }

  return { success: true, logId: log.id }
}
