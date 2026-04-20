'use server'

import { createClient } from '@/lib/supabase/server'
import type { AppointmentConfirmation } from './types'
import type { ConfirmationPending, PendingConfirmationWithDetails } from '@/types/confirmations'

export async function getPendingConfirmations(
  organizationId: string,
  employeeId?: string
): Promise<AppointmentConfirmation[]> {
  const supabase = await createClient()

  let query = (supabase as any)
    .from('appointment_confirmations')
    .select('*')
    .eq('organization_id', organizationId)
    .in('status', ['pending_employee', 'pending_reception'])
    .order('created_at', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getPendingConfirmations] Error:', error)
    return []
  }

  return (data as AppointmentConfirmation[]) || []
}

export async function getPendingFromAppointments(
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
    console.error('[getPendingFromAppointments] Error:', error)
    return []
  }

  return (data as PendingConfirmationWithDetails[]) || []
}

export async function getAppointmentConfirmationsByStatus(
  organizationId: string,
  statuses: string[]
): Promise<PendingConfirmationWithDetails[]> {
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
      confirmed_at,
      price_adjustment,
      payment_method,
      created_at,
      clients!clients_id(name, phone),
      employees!employees_id(name)
    `)
    .eq('organization_id', organizationId)
    .in('confirmation_status', statuses)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('[getAppointmentConfirmationsByStatus] Error:', error)
    return []
  }

  return (data as PendingConfirmationWithDetails[]) || []
}

export async function getEmployeeConfirmations(
  employeeId: string
): Promise<AppointmentConfirmation[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('appointment_confirmations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[getEmployeeConfirmations] Error:', error)
    return []
  }

  return (data as AppointmentConfirmation[]) || []
}

export async function getAllConfirmations(
  organizationId: string,
  status?: string
): Promise<AppointmentConfirmation[]> {
  const supabase = await createClient()

  let query = (supabase as any)
    .from('appointment_confirmations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('[getAllConfirmations] Error:', error)
    return []
  }

  return (data as AppointmentConfirmation[]) || []
}

export async function getConfirmationById(
  confirmationId: string
): Promise<AppointmentConfirmation | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('appointment_confirmations')
    .select('*')
    .eq('id', confirmationId)
    .single()

  if (error) {
    console.error('[getConfirmationById] Error:', error)
    return null
  }

  return data as AppointmentConfirmation
}
