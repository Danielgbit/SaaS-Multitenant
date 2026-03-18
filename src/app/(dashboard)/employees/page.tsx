import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEmployees } from '@/services/employees/getEmployees'
import { getAvailabilitySummaryForEmployees } from '@/services/availability/getAvailability'
import { getPendingInvitations } from '@/actions/invitations/getInvitations'
import { EmployeesClient } from './EmployeesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Empleados — SaaS',
  description: 'Gestiona los empleados de tu organización.',
}

export default async function EmployeesPage() {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Obtener organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    // Sin organización — estado inconsistente, redirigir
    redirect('/calendar')
  }

  // 3. Obtener empleados de la organización
  const employees = await getEmployees(orgMember.organization_id)

  // 4. Obtener resumen de disponibilidad
  const employeeIds = employees.map(e => e.id)
  const availabilitySummary = await getAvailabilitySummaryForEmployees(employeeIds)

  // 5. Crear mapa para acceso rápido
  const availabilityMap = new Map(
    availabilitySummary.map(a => [a.employee_id, a])
  )

  // 6. Obtener invitaciones pendientes
  const { invitations } = await getPendingInvitations(orgMember.organization_id)
  const invitationMap = new Map<string, any>()
  if (invitations) {
    for (const inv of invitations) {
      invitationMap.set(inv.employee_id, inv)
    }
  }

  return <EmployeesClient 
    employees={employees} 
    availabilityMap={availabilityMap} 
    invitationMap={invitationMap}
    organizationId={orgMember.organization_id}
  />
}
