import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingConfirmations } from '@/actions/confirmations/getConfirmations'
import { EmployeeConfirmations } from './EmployeeConfirmations'
import { ReceptionConfirmations } from './ReceptionConfirmations'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confirmaciones — SaaS',
  description: 'Gestiona las confirmaciones de servicios.',
}

export default async function ConfirmationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Obtener rol del usuario
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    redirect('/calendar')
  }

  const { organization_id, role } = orgMember

  // Obtener employee_id si es empleado
  let employeeId: string | undefined
  if (role === 'employee') {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()
    
    employeeId = employee?.id
  }

  // Obtener confirmaciones según el rol
  const confirmations = await getPendingConfirmations(organization_id, employeeId)

  // Redirigir según rol
  if (role === 'employee') {
    return <EmployeeConfirmations 
      confirmations={confirmations} 
      organizationId={organization_id}
      employeeId={employeeId!}
    />
  }

  // Owner, Admin, Staff ven la vista de recepción
  return <ReceptionConfirmations 
    confirmations={confirmations} 
    organizationId={organization_id}
  />
}
