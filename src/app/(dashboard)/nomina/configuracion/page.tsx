import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPayrollSettings } from '@/actions/payroll/getPayrollSettings'
import { PayrollSettingsClient } from '@/components/dashboard/payroll/PayrollSettingsClient'

export const metadata = {
  title: 'Configuración de Nómina | Prügressy',
  description: 'Configura el período de pago y opciones de nómina',
}

export default async function PayrollSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/calendar')

  if (!['owner', 'admin'].includes(orgMember.role)) {
    redirect('/dashboard')
  }

  const settingsResult = await getPayrollSettings(orgMember.organization_id)

  return (
    <PayrollSettingsClient
      organizationId={orgMember.organization_id}
      settings={settingsResult.data}
    />
  )
}
