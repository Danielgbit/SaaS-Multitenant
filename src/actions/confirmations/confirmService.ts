'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { appLog } from '@/lib/app-logger'
import { ConfirmServiceSchema, type ConfirmServiceState } from './schemas'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { finalizeAppointmentFinancials } from '@/lib/appointments/finalize-financials'
import { createEntryFromSource } from '@/actions/cash-sessions/createEntryFromSource'
import { canConfirm, calculateTotal } from './helpers'
import type { ServiceWithPrice, EmployeeServiceOverride } from './helpers'
import type { ConfirmationStatus } from '@/types/confirmations'

export async function confirmService(
  prevState: ConfirmServiceState,
  formData: FormData
): Promise<ConfirmServiceState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    logId: (formData.get('logId') as string | undefined) ?? undefined,
    paymentMethod: formData.get('paymentMethod') as string,
    notes: (formData.get('notes') as string | undefined) ?? undefined,
  }

  const parsed = ConfirmServiceSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointmentId, logId, paymentMethod, notes } = parsed.data

  const supabase = await createClient()

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id,
      organization_id,
      confirmation_status,
      completed_at,
      completed_by,
      price_adjustment,
      employee_id
    `)
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { success: false, error: 'Cita no encontrada.' }
  }

  if (!appointment.confirmation_status) {
    return { success: false, error: 'Estado de confirmación inválido.' }
  }

  const statusCheck = canConfirm(appointment.confirmation_status as ConfirmationStatus)
  if (!statusCheck.allowed) {
    return { success: false, error: statusCheck.reason! }
  }

  const access = await requireOrgAccess(appointment.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return access

  const { userId } = access.context

  const now = new Date().toISOString()

  // Get prices from appointment_services with employee override support
  const { data: appointmentServices } = await supabase
    .from('appointment_services')
    .select('service_id, services!inner(price)')
    .eq('appointment_id', appointmentId)

  const serviceIds = (appointmentServices ?? []).map(as => as.service_id)
  let overrides: EmployeeServiceOverride[] = []

  if (serviceIds.length > 0 && appointment.employee_id) {
    const { data: employeeServiceRows } = await supabase
      .from('employee_services')
      .select('service_id, price_override')
      .eq('employee_id', appointment.employee_id)
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

  const adjustment = appointment.price_adjustment ?? 0
  const currentPrice = calculateTotal(servicesWithPrice, overrides, adjustment)

  const { data: newLog, error: logError } = await supabase
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'confirmed',
      performed_by: userId,
      performed_by_role: 'assistant',
      price_before: currentPrice,
      price_after: currentPrice,
      payment_method: paymentMethod,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('[confirmService] Log error:', logError)
    return { success: false, error: 'Error al registrar la confirmación. Intenta de nuevo.' }
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      confirmation_status: 'confirmed',
      status: 'completed',
      confirmed_at: now,
      confirmed_by: userId,
      payment_method: paymentMethod,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[confirmService] Update error:', updateError)
    return { success: false, error: 'Error al confirmar la cita. Intenta de nuevo.' }
  }

  if (appointment.completed_by) {
    await supabase
      .from('notifications')
      .insert({
        organization_id: appointment.organization_id,
        user_id: appointment.completed_by,
        type: 'confirmation_sent',
        title: 'Cobro confirmado',
        message: `Tu servicio fue cobrado exitosamente`,
        metadata: {
          appointment_id: appointmentId,
          log_id: newLog.id,
          payment_method: paymentMethod,
        },
      })
  }

  try {
    revalidateTag(`confirmations-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[confirmService] revalidateTag error:', e)
  }
  try {
    revalidateTag(`pending-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[confirmService] revalidateTag error:', e)
  }
  try {
    revalidatePath('/nomina')
  } catch (e) {
    console.warn('[confirmService] revalidatePath /payroll error:', e)
  }
  try {
    revalidatePath('/calendar')
  } catch (e) {
    console.warn('[confirmService] revalidatePath /calendar error:', e)
  }

  // Auto-agregar a nómina y comisión (orquestado por helper)
  if (appointment.employee_id) {
    const financialResult = await finalizeAppointmentFinancials(
      appointmentId,
      appointment.organization_id,
      appointment.employee_id,
      `confirmService_${userId}`
    )
    if (!financialResult.payroll.success) {
      appLog('error', '[confirmService] payroll failed', {
        appointmentId,
        error: financialResult.payroll.error,
      })
    }
  } else {
    appLog('warn', '[confirmService] appointment without employee_id', {
      appointmentId,
    })
  }

  // Auto-registrar movimiento de caja
  try {
    const entryResult = await createEntryFromSource({
      organization_id: appointment.organization_id,
      source_type: 'appointment',
      source_id: appointmentId,
      entry_type: 'income',
      direction: 'in',
      amount: currentPrice,
      payment_method: paymentMethod as any,
      title: `Pago servicio`,
      created_by: userId,
      created_via: 'appointment_auto',
    })
    if (!entryResult.success) {
      console.error('[confirmService] cash entry error:', entryResult.error)
    }
  } catch (e) {
    console.error('[confirmService] cash entry exception:', e)
  }

  return { success: true, appointmentId }
}
