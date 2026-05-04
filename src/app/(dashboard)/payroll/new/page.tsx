import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPayrollPeriods } from '@/actions/payroll/getPayrollDashboard'
import { CreatePeriodPage } from '@/components/dashboard/payroll/CreatePeriodPage'

export const metadata = {
  title: 'Crear Período | Nómina Prügressy',
  description: 'Crear un nuevo período de nómina',
}

export default async function NewPayrollPeriodPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  if (orgMember.role === 'empleado') {
    redirect('/payroll/mi')
  }

  // Get existing periods to check for duplicates
  const periodsResult = await getPayrollPeriods(orgMember.organization_id, 120) // 10 years
  const existingPeriods = periodsResult.data?.map(p => p.period) || []

  // Get active employees
  const { data: employees } = await (supabase as any)
    .from('employees')
    .select('id, name, contract_type, payment_type, percentage, base_salary')
    .eq('organization_id', orgMember.organization_id)
    .eq('active', true)
    .order('name')

  return (
    <CreatePeriodPage
      organizationId={orgMember.organization_id}
      employees={employees || []}
      existingPeriods={existingPeriods}
    />
  )
}