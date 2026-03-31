'use server'

import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from './normalizePhone'
import type { Employee } from '@/types/employees'

interface FindByPhoneOptions {
  phone: string
  organizationId: string
  excludeEmployeeId?: string
}

interface FindByPhoneResult {
  employee: Employee | null
  error: string | null
}

/**
 * Finds an employee by phone number within an organization.
 * Normalizes the phone before searching.
 */
export async function findByPhone({
  phone,
  organizationId,
  excludeEmployeeId,
}: FindByPhoneOptions): Promise<FindByPhoneResult> {
  const supabase = await createClient()
  const normalizedPhone = normalizePhone(phone)

  if (!normalizedPhone) {
    return { employee: null, error: null }
  }

  let query = supabase
    .from('employees')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('phone', normalizedPhone)

  if (excludeEmployeeId) {
    query = query.neq('id', excludeEmployeeId)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { employee: null, error: null }
    }
    console.error('Error finding employee by phone:', error)
    return { employee: null, error: 'Error al buscar empleado' }
  }

  return { employee: data as Employee, error: null }
}
