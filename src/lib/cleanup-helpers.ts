'use server'

import { createClient } from '@/lib/supabase/server'

export interface PurgeCandidate {
  id: string
  client_id: string
  employee_id: string
  start_time: string
  end_time: string
  status: string
  confirmation_status: string | null
  price_adjustment: number | null
  client_name?: string
  employee_name?: string
}

export interface PurgeResult {
  success: boolean
  deletedCount?: number
  candidates?: PurgeCandidate[]
  oldestDate?: string
  error?: string
}

export async function getAppointmentsToPurge(
  organizationId: string,
  olderThanDays: number
): Promise<PurgeCandidate[]> {
  const supabase = await createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      client_id,
      employee_id,
      start_time,
      end_time,
      status,
      confirmation_status,
      price_adjustment,
      clients!inner(name),
      employees!inner(name)
    `)
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .lt('end_time', cutoffDate.toISOString())
    .order('end_time', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).map((apt: any) => ({
    id: apt.id,
    client_id: apt.client_id,
    employee_id: apt.employee_id,
    start_time: apt.start_time,
    end_time: apt.end_time,
    status: apt.status,
    confirmation_status: apt.confirmation_status,
    price_adjustment: apt.price_adjustment,
    client_name: apt.clients?.name,
    employee_name: apt.employees?.name,
  }))
}

export async function countAppointmentsToPurge(
  organizationId: string,
  olderThanDays: number
): Promise<{ count: number; oldestDate: string | null }> {
  const supabase = await createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .lt('end_time', cutoffDate.toISOString())

  if (error) {
    throw error
  }

  const { data: oldest } = await supabase
    .from('appointments')
    .select('end_time')
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .lt('end_time', cutoffDate.toISOString())
    .order('end_time', { ascending: true })
    .limit(1)
    .single()

  return {
    count: count || 0,
    oldestDate: oldest?.end_time || null,
  }
}

export async function executePurge(
  organizationId: string,
  olderThanDays: number
): Promise<{ deletedCount: number }> {
  const supabase = await createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { data: deleted, error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .lt('end_time', cutoffDate.toISOString())
    .select('id')

  if (deleteError) {
    throw deleteError
  }

  return { deletedCount: (deleted || []).length }
}

export async function getAppointmentsByFilters(
  organizationId: string,
  options: {
    search?: string
    status?: 'completed' | 'cancelled' | 'no_show' | 'all'
    limit?: number
  }
): Promise<PurgeCandidate[]> {
  const supabase = await createClient()
  const { search, status = 'all', limit = 200 } = options

  let query = supabase
    .from('appointments')
    .select(`
      id,
      client_id,
      employee_id,
      start_time,
      end_time,
      status,
      confirmation_status,
      price_adjustment,
      clients!inner(name),
      employees!inner(name)
    `)
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .order('end_time', { ascending: false })
    .limit(limit)

  if (search && search.trim()) {
    query = query.or(
      `clients.name.ilike.%${search}%,employees.name.ilike.%${search}%`
    )
  }

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((apt: any) => ({
    id: apt.id,
    client_id: apt.client_id,
    employee_id: apt.employee_id,
    start_time: apt.start_time,
    end_time: apt.end_time,
    status: apt.status,
    confirmation_status: apt.confirmation_status,
    price_adjustment: apt.price_adjustment,
    client_name: apt.clients?.name,
    employee_name: apt.employees?.name,
  }))
}
