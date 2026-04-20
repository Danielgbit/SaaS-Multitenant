import { createClient } from '@/lib/supabase/server'
import type { ConfirmationPending, PendingConfirmationWithDetails } from '@/types/confirmations'

export async function getPendingConfirmationsForOrg(
  organizationId: string,
  employeeId?: string
): Promise<PendingConfirmationWithDetails[]> {
  const supabase = await createClient()

  let query = (supabase as any)
    .from('appointments')
    .select(`
      id,
      organization_id,
      employee_id,
      start_time,
      end_time,
      status,
      notes,
      confirmation_status,
      completed_at,
      confirmed_at,
      price_adjustment,
      payment_method,
      created_at,
      clients!clients_id(name, phone),
      employees!employees_id(name)
    `)
    .eq('organization_id', organizationId)
    .in('confirmation_status', ['completed', 'needs_review'])
    .order('start_time', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getPendingConfirmationsForOrg] Error:', error)
    return []
  }

  return (data as PendingConfirmationWithDetails[]) || []
}

export async function getAppointmentWithConfirmationStatus(
  appointmentId: string
): Promise<PendingConfirmationWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      organization_id,
      employee_id,
      start_time,
      end_time,
      status,
      notes,
      confirmation_status,
      completed_at,
      completed_by,
      confirmed_at,
      confirmed_by,
      price_adjustment,
      payment_method,
      created_at,
      clients!clients_id(name, phone),
      employees!employees_id(name)
    `)
    .eq('id', appointmentId)
    .single()

  if (error) {
    console.error('[getAppointmentWithConfirmationStatus] Error:', error)
    return null
  }

  return data as PendingConfirmationWithDetails
}
