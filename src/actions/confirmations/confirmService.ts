'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { appLog } from '@/lib/app-logger'
import { ConfirmServiceSchema, type ConfirmServiceState } from './schemas'

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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'No autorizado.' }
  }

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

  if (appointment.confirmation_status === 'confirmed') {
    return { success: false, error: 'Esta cita ya fue confirmada.' }
  }

  if (appointment.confirmation_status === 'scheduled') {
    return { success: false, error: 'Esta cita aún no fue marcada por el empleado.' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', appointment.organization_id)
    .single()

  if (orgError || !orgMember) {
    return { success: false, error: 'No perteneces a esta organización.' }
  }

  if (!['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { success: false, error: 'No tienes permiso para confirmar cobros.' }
  }

  const now = new Date().toISOString()

  // Get prices from appointment_services with employee override support
  const { data: appointmentServices } = await supabase
    .from('appointment_services')
    .select('service_id, services(price)')
    .eq('appointment_id', appointmentId)

  let currentPrice = 0
  for (const as of appointmentServices || []) {
    // Check for employee-specific price override
    const { data: employeeService } = await supabase
      .from('employee_services')
      .select('price_override')
      .eq('employee_id', appointment.employee_id!)
      .eq('service_id', as.service_id)
      .single()

    // Use override if exists, otherwise use base price
    const price = employeeService?.price_override || as.services?.price || 0
    currentPrice += price
  }

  const { data: newLog, error: logError } = await supabase
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'confirmed',
      performed_by: user.id,
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
      confirmed_by: user.id,
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
    revalidatePath('/payroll')
  } catch (e) {
    console.warn('[confirmService] revalidatePath /payroll error:', e)
  }
  try {
    revalidatePath('/calendar')
  } catch (e) {
    console.warn('[confirmService] revalidatePath /calendar error:', e)
  }

  // Auto-agregar a nómina (fire-and-forget)
  import('@/actions/payroll/addAppointmentToPayroll').then((m) =>
    m.addAppointmentToPayroll(appointmentId).catch((e) => {
      console.error('[confirmService] payroll auto-add error:', e)
    })
  )

  // Auto-registrar comisión (fire-and-forget)
  const accrualKey = `commission_accrued:hook:${appointmentId}:${appointment.employee_id}:confirmService`
  import('@/actions/financial/recordCommissionAccrual').then((m) =>
    m.recordCommissionAccrual({
      appointmentId,
      organizationId: appointment.organization_id,
      idempotencyKey: accrualKey,
    }).then((result) => {
      if ('error' in result) {
        appLog('error', '[confirmService] commission accrual failed', {
          appointmentId,
          error: result.error,
        })
      }
    }).catch((e) => {
      appLog('error', '[confirmService] commission accrual exception', {
        appointmentId,
        error: e instanceof Error ? e.message : String(e),
      })
    })
  )

  // Auto-registrar movimiento de caja (fire-and-forget, feature no completada)
  import('@/actions/cash-sessions/createEntryFromSource').then((m) =>
    m.createEntryFromSource({
      organization_id: appointment.organization_id,
      source_type: 'appointment',
      source_id: appointmentId,
      entry_type: 'income',
      direction: 'in',
      amount: currentPrice,
      payment_method: paymentMethod as any,
      title: `Pago servicio`,
      created_by: user.id,
      created_via: 'appointment_auto',
    }).catch((e) => {
      console.error('[confirmService] cash entry error:', e)
    })
  ).catch(() => {}) // modulo no disponible hasta que se complete la feature

  return { success: true, appointmentId }
}
