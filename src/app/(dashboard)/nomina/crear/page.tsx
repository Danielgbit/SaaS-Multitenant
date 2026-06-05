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
    .select('id, name, contract_type, payment_type, percentage, base_salary, employment_type, part_time_percentage')
    .eq('organization_id', orgMember.organization_id)
    .eq('active', true)
    .order('name')

  // Find previous period for "copy from" feature
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  let previousPeriod = null

  if (currentMonth === 1) {
    const prevResult = await (supabase as any)
      .from('payroll_periods')
      .select('period, total_employees')
      .eq('organization_id', orgMember.organization_id)
      .eq('period', `${currentYear - 1}-12`)
      .single()
    if (prevResult?.data) {
      previousPeriod = prevResult.data
    }
  } else {
    const prevMonth = (currentMonth - 1).toString().padStart(2, '0')
    const prevResult = await (supabase as any)
      .from('payroll_periods')
      .select('period, total_employees')
      .eq('organization_id', orgMember.organization_id)
      .eq('period', `${currentYear}-${prevMonth}`)
      .single()
    if (prevResult?.data) {
      previousPeriod = prevResult.data
    }
  }

  return (
    <CreatePeriodPage
      organizationId={orgMember.organization_id}
      employees={employees || []}
      existingPeriods={existingPeriods}
      previousPeriod={previousPeriod}
    />
  )
}