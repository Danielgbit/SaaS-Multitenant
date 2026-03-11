import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/../types/supabase'

type Appointment = Database['public']['Tables']['appointments']['Row']

/**
 * Obtiene las citas de un empleado para un rango de fechas.
 * Útil para el calendario.
 */
export async function getAppointmentsByEmployee(
  employeeId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
): Promise<Appointment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('start_time', `${startDate}T00:00:00.000Z`)
    .lte('start_time', `${endDate}T23:59:59.999Z`)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error.message)
    throw new Error('No se pudieron obtener las citas')
  }

  return data ?? []
}

/**
 * Obtiene las citas de una organización para un rango de fechas.
 * Útil para vista general del calendario.
 */
export async function getAppointmentsByOrganization(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('start_time', `${startDate}T00:00:00.000Z`)
    .lte('start_time', `${endDate}T23:59:59.999Z`)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error.message)
    throw new Error('No se pudieron obtener las citas')
  }

  return data ?? []
}

/**
 * Obtiene una cita específica por ID
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching appointment:', error.message)
    throw new Error('No se pudo obtener la cita')
  }

  return data
}

/**
 * Obtiene las citas de un cliente
 */
export async function getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching client appointments:', error.message)
    throw new Error('No se pudieron obtener las citas del cliente')
  }

  return data ?? []
}
