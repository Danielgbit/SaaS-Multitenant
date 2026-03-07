import { createClient } from '@/lib/supabase/server'
import type { Employee } from '@/types/employees'

/**
 * Obtiene todos los empleados de una organización, ordenados por fecha de creación.
 * Solo debe llamarse desde Server Components o Server Actions.
 */
export async function getEmployees(organizationId: string): Promise<Employee[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error al obtener empleados:', error.message)
    throw new Error('No se pudieron obtener los empleados.')
  }

  return data ?? []
}
