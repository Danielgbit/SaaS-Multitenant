import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPayrollDashboard } from '@/actions/payroll/getPayrollDashboard'
import { PayrollDashboard } from '@/components/dashboard/payroll/PayrollDashboard'

export const metadata = {
  title: 'Nómina | Prügressy',
  description: 'Gestión de nómina y pagos a empleados',
}

export default async function PayrollPage() {
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

  const dashboardResult = await getPayrollDashboard(orgMember.organization_id)

  return (
    <PayrollDashboard
      dashboardData={dashboardResult.data || {
        current_period: null,
        previous_periods: [],
        pending_periods: [],
        total_pending_net: 0,
        total_pending_employees: 0,
        employees_ready_to_pay: 0,
      }}
    />
  )
}