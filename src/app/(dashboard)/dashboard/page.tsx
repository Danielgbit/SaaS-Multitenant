import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/analytics/DashboardClient'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard | Prügressy',
  description: 'Analiza el rendimiento de tu negocio. Estadísticas de citas, ingresos, clientes y más.',
  robots: 'noindex, nofollow',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  const organizationId = orgMember?.organization_id
  const role = orgMember?.role

  let employeeName: string | null = null
  let organizationName: string | null = null

  if (organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()
    organizationName = org?.name ?? null
  }

  if (role === 'empleado') {
    const { data: employee } = await (supabase as any)
      .from('employees')
      .select('name')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    employeeName = employee?.name
  }

  if (!organizationId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">No tienes una organización asociada</p>
      </div>
    )
  }

  return <DashboardClient organizationId={organizationId} role={role} organizationName={organizationName} employeeName={employeeName} />
}
