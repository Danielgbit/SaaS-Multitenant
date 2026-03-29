'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PermanentDeleteSchema = z.object({
  employeeId: z.string().uuid(),
  organizationId: z.string().uuid(),
})

export type PermanentDeleteResult =
  | { success: true }
  | { success: false; error: string; hasActiveAppointments?: boolean }

export async function permanentDeleteEmployee(
  employeeId: string,
  organizationId: string
): Promise<PermanentDeleteResult> {
  const validated = PermanentDeleteSchema.safeParse({ employeeId, organizationId })
  if (!validated.success) {
    return { success: false, error: 'Datos inválidos.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado.' }
  }

  // Verify user is owner or admin
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (orgError || !orgMember) {
    return { success: false, error: 'No se encontró organización.' }
  }

  if (!['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners y admins pueden eliminar empleados permanentemente.' }
  }

  // Check for active appointments (future appointments that are not cancelled or completed)
  const { count: activeAppointmentsCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .neq('status', 'cancelled')
    .neq('status', 'completed')
    .gte('start_time', new Date().toISOString())

  if (activeAppointmentsCount && activeAppointmentsCount > 0) {
    return {
      success: false,
      error: `Este empleado tiene ${activeAppointmentsCount} cita(s) activa(s). Primero archívalo para cancelarlas o reprogramarlas.`,
      hasActiveAppointments: true,
    }
  }

  // Get employee name for preserving in historical records
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, name')
    .eq('id', employeeId)
    .single()

  if (employeeError || !employee) {
    return { success: false, error: 'Empleado no encontrado.' }
  }

  // Step 1: Preserve employee name in appointments
  const { error: appointmentsError } = await (supabase as any)
    .from('appointments')
    .update({
      employee_id: null,
      deleted_employee_name: employee.name,
    })
    .eq('employee_id', employeeId)

  if (appointmentsError) {
    console.error('Error updating appointments:', appointmentsError)
    return { success: false, error: 'No se pudieron actualizar las citas.' }
  }

  // Step 2: Preserve employee name in appointment_confirmations
  const { error: confirmationsError } = await (supabase as any)
    .from('appointment_confirmations')
    .update({
      employee_id: null,
      deleted_employee_name: employee.name,
    })
    .eq('employee_id', employeeId)

  if (confirmationsError) {
    console.error('Error updating appointment_confirmations:', confirmationsError)
    // Rollback: restore employee_id in appointments
    await (supabase as any)
      .from('appointments')
      .update({ employee_id: employeeId, deleted_employee_name: null })
      .eq('deleted_employee_name', employee.name)
    return { success: false, error: 'No se pudieron actualizar las confirmaciones.' }
  }

  // Step 3: Delete employee (cascades to: employee_availability, employee_services, employee_invitations, employee_loans, payroll_receipts)
  const { error: deleteError } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId)

  if (deleteError) {
    console.error('Error deleting employee:', deleteError)
    // Attempt rollback of both updates
    await (supabase as any)
      .from('appointments')
      .update({ employee_id: employeeId, deleted_employee_name: null })
      .eq('deleted_employee_name', employee.name)
    await (supabase as any)
      .from('appointment_confirmations')
      .update({ employee_id: employeeId, deleted_employee_name: null })
      .eq('deleted_employee_name', employee.name)
    return { success: false, error: 'No se pudo eliminar al empleado.' }
  }

  revalidatePath('/employees')
  return { success: true }
}
