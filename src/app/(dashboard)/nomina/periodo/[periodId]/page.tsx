import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPayrollPeriodById } from '@/actions/payroll/getPayrollDashboard'
import { getPayrollItems } from '@/actions/payroll/getPayrollItems'
import { getPayrollReceipts } from '@/actions/payroll/generatePayrollReceipt'
import { PeriodDetailView } from '@/components/dashboard/payroll/PeriodDetailView'

export const metadata = {
  title: 'Detalle de Período | Nómina Prügressy',
  description: 'Ver detalles de un período de nómina',
}

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ periodId: string }>
}) {
  const resolvedParams = await params
  const { periodId } = resolvedParams

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

  const [periodResult, itemsResult, receiptsResult] = await Promise.all([
    getPayrollPeriodById(periodId),
    getPayrollItems(periodId),
    getPayrollReceipts(user.id),
  ])

  if (!periodResult.success || !periodResult.data) {
    redirect('/nomina')
  }

  const period = periodResult.data

  if (period.organization_id !== orgMember.organization_id) {
    redirect('/nomina')
  }

  const receipts = receiptsResult.data?.filter(
    (r: any) => r.payroll_period_id === periodId || r.period_start
  ) || []

  return (
    <PeriodDetailView
      period={period}
      items={itemsResult.data || []}
      receipts={receipts}
      organizationId={orgMember.organization_id}
      userRole={orgMember.role}
    />
  )
}