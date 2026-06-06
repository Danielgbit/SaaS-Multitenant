'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { appLog } from '@/lib/app-logger'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { MarkManuallySchema, type MarkManuallyState } from './schemas'

export async function markManually(
  prevState: MarkManuallyState,
  formData: FormData
): Promise<MarkManuallyState> {
  const rawData = {
    appointmentId: formData.get('appointmentId') as string,
    reason: formData.get('reason') as string,
  }

  const parsed = MarkManuallySchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { appointmentId, reason } = parsed.data

  const supabase = await createClient()

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('id, organization_id, employee_id, client_id, status, confirmation_status, price_adjustment, payment_method, created_at')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return { error: 'Cita no encontrada.' }
  }

  if (appointment.confirmation_status === 'confirmed') {
    return { error: 'Esta cita ya fue confirmada.' }
  }

  const access = await requireOrgAccess(appointment.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return { error: access.error }

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

  const { data: log, error: logError } = await supabase
    .from('confirmation_logs')
    .insert({
      appointment_id: appointmentId,
      organization_id: appointment.organization_id,
      action: 'manually_set',
      performed_by: user.id,
      performed_by_role: 'assistant',
      price_before: currentPrice,
      price_after: currentPrice,
      notes: `Marca manual: ${reason}`,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('[markManually] Log error:', logError)
    return { error: 'Error al registrar la acción. Intenta de nuevo.' }
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      confirmation_status: 'completed',
      status: 'completed',
      completed_at: now,
      completed_by: user.id,
    })
    .eq('id', appointmentId)

  if (updateError) {
    console.error('[markManually] Update error:', updateError)
    return { error: 'Error al marcar la cita. Intenta de nuevo.' }
  }

  // Create appointment_confirmations record so it appears in /confirmations
  const { data: confirmation, error: confError } = await supabase
    .from('appointment_confirmations')
    .insert({
      organization_id: appointment.organization_id!,
      employee_id: appointment.employee_id!,
      appointment_id: appointmentId,
      services: [],
      total_amount: currentPrice,
      confirmation_type: 'scheduled',
      status: 'pending_reception',
      employee_confirmed_at: now,
      client_name: null,
      client_phone: null,
      notes: reason ? `Confirmado por admin: ${reason}` : null,
    })
    .select('id')
    .single()

  if (confError) {
    console.error('[markManually] Confirmation insert error:', confError)
    // Don't return error - the appointment was already updated
  }

  // Auto-registrar transacción financiera
  try {
    const apt = appointment as unknown as { payment_method?: string; client_id?: string }
    const { data: account } = await supabase
      .from('client_accounts')
      .select('id, balance')
      .eq('client_id', apt.client_id!)
      .single()

    if (account) {
      const balance = account.balance || 0
      await supabase.from('client_account_transactions').insert({
        account_id: account.id,
        organization_id: appointment.organization_id,
        transaction_type: 'payment',
        amount: currentPrice,
        balance_after: balance + currentPrice,
        payment_method: apt.payment_method || 'cash',
        appointment_id: appointmentId,
        notes: reason ? `Marcado manual: ${reason}` : 'Marcado manual',
        created_by: user.id,
      }).select('id')
    }
  } catch (e) {
    console.error('[markManually] financial auto-add error:', e)
  }

  // Send service_ready notification to staff
  const { data: orgMembers, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', appointment.organization_id)
    .in('role', ['owner', 'admin', 'staff'])

  if (!membersError && orgMembers) {
    const notificationEntries = orgMembers.map((member: any) => ({
      organization_id: appointment.organization_id,
      user_id: member.user_id,
      type: 'service_ready',
      title: 'Servicio completado',
      message: 'Un servicio está listo para cobrar. Revisa /confirmations.',
      metadata: {
        appointment_id: appointmentId,
        confirmation_id: confirmation?.id || null
      }
    }))

    await supabase
      .from('notifications')
      .insert(notificationEntries)
  }

  try {
    revalidateTag(`confirmations-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[markManually] revalidateTag error:', e)
  }
  try {
    revalidateTag(`pending-${appointment.organization_id}`, 'max')
  } catch (e) {
    console.warn('[markManually] revalidateTag error:', e)
  }
  try {
    revalidatePath('/nomina')
  } catch (e) {
    console.warn('[markManually] revalidatePath /payroll error:', e)
  }
  try {
    revalidatePath('/calendar')
  } catch (e) {
    console.warn('[markManually] revalidatePath /calendar error:', e)
  }

  // Auto-registrar comisión (fire-and-forget, solo si hay confirmación financiera)
  if (appointment.payment_method || currentPrice > 0) {
    const accrualKey = `commission_accrued:hook:${appointmentId}:${appointment.employee_id}:markManually`
    import('@/actions/financial/recordCommissionAccrual').then((m) =>
      m.recordCommissionAccrual({
        appointmentId,
        organizationId: appointment.organization_id!,
        idempotencyKey: accrualKey,
      }).then((result) => {
        if ('error' in result) {
          appLog('error', '[markManually] commission accrual failed', {
            appointmentId,
            error: result.error,
          })
        }
      }).catch((e) => {
        appLog('error', '[markManually] commission accrual exception', {
          appointmentId,
          error: e instanceof Error ? e.message : String(e),
        })
      })
    )
  }

  // Shadow Mode: capture context for fire-and-forget validation
  const shadowContext = {
    appointmentId,
    organizationId: appointment.organization_id,
    correlationId: shadowSeed.correlationId,
    actorId: user.id,
    timestamp: now,
    notes: reason,
    seed: shadowSeed,
  }

  // Fire-and-forget shadow validation (does not affect production)
  import('@/lib/shadow').catch(() => {})

  return { success: true, logId: log.id }
}
