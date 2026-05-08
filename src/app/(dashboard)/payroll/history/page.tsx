import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PayrollHistory } from '@/components/dashboard/payroll/PayrollHistory'

export const metadata = {
  title: 'Historial de Nómina | Prügressy',
  description: 'Ver todos los períodos de nómina anteriores',
}

export default async function PayrollHistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  const { data: periods } = await (supabase as any)
    .from('payroll_periods')
    .select('*')
    .eq('organization_id', orgMember.organization_id)
    .order('period', { ascending: false })

  return (
    <PayrollHistory
      periods={(periods || []).filter((p: any) => p.status === 'paid')}
    />
  )
}
