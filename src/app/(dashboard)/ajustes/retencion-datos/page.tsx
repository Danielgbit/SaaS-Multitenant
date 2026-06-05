import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DataRetentionClient } from '@/components/dashboard/settings/DataRetentionClient'
import { getRetentionSettings } from '@/actions/appointments/purgeAppointments'

export const metadata = {
  title: 'Retención de Datos - Prügressy',
  description: 'Configura la purga automática de citas antiguas',
}

export default async function DataRetentionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    redirect('/onboarding')
  }

  if (!['owner', 'admin'].includes(orgMember.role)) {
    redirect('/dashboard')
  }

  const retentionSettings = await getRetentionSettings(orgMember.organization_id)

  return (
    <DataRetentionClient
      organizationId={orgMember.organization_id}
      initialSettings={retentionSettings}
    />
  )
}
