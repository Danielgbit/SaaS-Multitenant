import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServices } from '@/services/services/getServices'
import { WalkinForm } from './WalkinForm'

export const dynamic = 'force-dynamic'

export default async function WalkinPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    redirect('/calendar')
  }

  const { organization_id, role } = orgMember

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

  if (!employeeId) {
    redirect('/calendar')
  }

  const services = await getServices(organization_id)
  const activeServices = services.filter((s: any) => s.active)

  return (
    <WalkinForm
      services={activeServices}
      organizationId={organization_id}
      employeeId={employeeId}
    />
  )
}

export const metadata = {
  title: 'Registrar Walk-in — SaaS',
  description: 'Registrar servicio sin cita previa.',
}
