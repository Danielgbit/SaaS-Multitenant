import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPayrollSettings } from '@/actions/payroll/getPayrollSettings'
import { getPendingLoans } from '@/actions/payroll/getPendingLoans'
import { PayrollClient } from '@/components/dashboard/payroll/PayrollClient'

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

  const settingsResult = await getPayrollSettings(orgMember.organization_id)

  const { data: employees } = await (supabase as any)
    .from('employees')
    .select(`
      *,
      employee_loans(*)
    `)
    .eq('organization_id', orgMember.organization_id)
    .eq('active', true)
    .order('name')

  const employeesWithDebt = await Promise.all(
    (employees || []).map(async (emp: any) => {
      const loansResult = await getPendingLoans(emp.id)
      const totalDebt = (loansResult.data || []).reduce(
        (sum: number, l: any) => sum + l.remaining_amount,
        0
      )
      return {
        ...emp,
        total_pending_debt: totalDebt,
      }
    })
  )

  return (
    <PayrollClient
      employees={employeesWithDebt || []}
      organizationId={orgMember.organization_id}
      settings={settingsResult.data}
      userRole={orgMember.role}
    />
  )
}
