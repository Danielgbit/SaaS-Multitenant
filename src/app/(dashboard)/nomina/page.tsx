import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getPayrollDashboard } from '@/actions/payroll/getPayrollDashboard'
import { PayrollDashboard } from '@/components/dashboard/payroll/PayrollDashboard'

export const metadata = {
  title: 'Nómina | Prügressy',
  description: 'Gestión de nómina y pagos a empleados',
}

const DASHBOARD_FALLBACK = {
  current_period: null,
  previous_periods: [],
  pending_periods: [],
  total_pending_net: 0,
  total_pending_employees: 0,
  employees_ready_to_pay: 0,
  total_employee_debt: 0,
}

function PayrollSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-2xl h-32 bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl h-28 bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="rounded-2xl h-64 bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}

async function PayrollContent() {
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
    redirect('/nomina/mi')
  }

  const dashboardResult = await getPayrollDashboard(orgMember.organization_id)

  if (!dashboardResult.success) {
    return (
      <PayrollDashboard
        dashboardData={DASHBOARD_FALLBACK}
        error={dashboardResult.error || 'Error desconocido'}
      />
    )
  }

  return (
    <PayrollDashboard
      dashboardData={dashboardResult.data || DASHBOARD_FALLBACK}
    />
  )
}

export default async function PayrollPage() {
  return (
    <Suspense fallback={<PayrollSkeleton />}>
      <PayrollContent />
    </Suspense>
  )
}
