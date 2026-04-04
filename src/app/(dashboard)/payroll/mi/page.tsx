import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateCommission } from '@/actions/payroll/calculateCommission'
import { getPendingLoans, getEmployeeDebtInfo } from '@/actions/payroll/getPendingLoans'
import { getPayrollReceipts } from '@/actions/payroll/generatePayrollReceipt'
import { EmployeePayrollDetail } from '@/components/dashboard/payroll/EmployeePayrollDetail'

export const metadata = {
  title: 'Mi Nómina | Prügressy',
  description: 'Ver tu nómina y generar recibos de pago',
}

function getDefaultPeriod() {
  const today = new Date()
  const dayOfWeek = today.getDay()

  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

export default async function MyPayrollPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  if (!['empleado'].includes(orgMember.role)) {
    redirect('/payroll')
  }

  const { data: employee } = await (supabase as any)
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (!employee) {
    redirect('/calendar')
  }

  const defaultPeriod = getDefaultPeriod()

  const [commissionResult, debtInfoResult, receiptsResult] = await Promise.all([
    calculateCommission(employee.id, defaultPeriod.start, defaultPeriod.end),
    getEmployeeDebtInfo(employee.id),
    getPayrollReceipts(employee.id),
  ])

  return (
    <EmployeePayrollDetail
      employee={employee}
      defaultPeriod={defaultPeriod}
      initialCommission={commissionResult.data}
      debtInfo={debtInfoResult.data}
      receipts={receiptsResult.data || []}
      organizationId={orgMember.organization_id}
      userRole={orgMember.role}
    />
  )
}
