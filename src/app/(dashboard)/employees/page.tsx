import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEmployees } from '@/services/employees/getEmployees'
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

  return <EmployeesClient employees={employees} />
}
