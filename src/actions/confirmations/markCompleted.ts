'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { MarkCompletedSchema, type MarkCompletedState } from './schemas'
import { canMarkCompleted, calculateTotal } from './helpers'
import type { ServiceWithPrice, EmployeeServiceOverride } from './helpers'
import type { ConfirmationStatus } from '@/types/confirmations'

export async function markCompleted(
  prevState: MarkCompletedState,
  formData: FormData
): Promise<MarkCompletedState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    priceAdjustment: formData.get('priceAdjustment') 
      ? Number(formData.get('priceAdjustment')) 
      : 0,
    notes: (formData.get('notes') as string | undefined) ?? undefined,
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

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id,
      organization_id,
      employee_id,
      client_id,
      start_time,
      end_time,
      status,
      confirmation_status,
      price_adjustment,
      created_at,
      clients (
        name,
        phone
      )
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

  const access = await requireOrgAccess(appointment.organization_id)
  if (!access.success) return { error: access.error }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, user_id, name')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'No se encontró tu perfil de empleado.' }
  }

  if (!appointment.confirmation_status) {
    return { error: 'Estado de confirmación inválido.' }
  }

  const transition = canMarkCompleted(
    appointment.confirmation_status as ConfirmationStatus,
    appointment.employee_id,
    employee.id
  )
  if (!transition.allowed) {
    return { error: transition.reason! }
  }

  const now = new Date().toISOString()

  // Shadow Mode: capture seed BEFORE mutation (for drift detection)
  const shadowSeed = {
    appointmentId,
    observedUpdatedAt: appointment.created_at,
    initialStatus: appointment.status,
    initialConfirmationStatus: appointment.confirmation_status,
    correlationId: crypto.randomUUID(),
  }

  // Get prices from appointment_services with employee override support
  const { data: appointmentServices } = await supabase
    .from('appointment_services')
    .select('service_id, services!inner(price)')
    .eq('appointment_id', appointmentId)

  const serviceIds = (appointmentServices ?? []).map(as => as.service_id)
  let overrides: EmployeeServiceOverride[] = []

  if (serviceIds.length > 0) {
    const { data: employeeServiceRows } = await supabase
      .from('employee_services')
      .select('service_id, price_override')
      .eq('employee_id', appointment.employee_id!)
      .in('service_id', serviceIds)

    overrides = (employeeServiceRows ?? []).map(es => ({
      service_id: es.service_id,
      price_override: es.price_override,
    }))
  }

  const servicesWithPrice: ServiceWithPrice[] = (appointmentServices ?? []).map(as => ({
    service_id: as.service_id,
    price: as.services.price,
  }))

  const basePrice = calculateTotal(servicesWithPrice, overrides, 0)
  const finalPrice = basePrice + (priceAdjustment || 0)

  const { data: log, error: logError } = await supabase
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

  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      confirmation_status: 'completed',
      status: 'completed',
      completed_at: now,
      completed_by: user.id,
      price_adjustment: finalPrice,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[markCompleted] Update error:', updateError)
    return { error: 'Error al actualizar la cita. Intenta de nuevo.' }
  }

  const { data: assistants, error: asstError } = await supabase
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
      message: `${employee.name} completó un servicio${(appointment.clients as any)?.name ? ` - ${(appointment.clients as any).name}` : ''}`,
      metadata: {
        appointment_id: appointmentId,
        employee_id: employee.id,
        employee_name: employee.name,
        client_name: (appointment.clients as any)?.name || null,
        client_phone: (appointment.clients as any)?.phone || null,
        log_id: log.id,
        price: finalPrice,
      },
    }))

    await supabase
      .from('notifications')
      .insert(notifications)
  }

  try {
    revalidateTag(`confirmations-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[markCompleted] revalidateTag error:', e)
  }
  try {
    revalidateTag(`pending-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[markCompleted] revalidateTag error:', e)
  }

  // Shadow Mode: capture context for fire-and-forget validation
  const shadowContext = {
    appointmentId,
    organizationId: appointment.organization_id,
    correlationId: shadowSeed.correlationId,
    actorId: user.id,
    timestamp: now,
    priceAdjustment,
    notes,
    seed: shadowSeed,
  }

  // Fire-and-forget shadow validation (does not affect production)
  import('@/lib/shadow').catch(() => {})

  return { success: true, logId: log.id }
}
