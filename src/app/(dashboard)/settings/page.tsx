import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export const metadata = {
  title: 'Configuración - Prügressy',
  description: 'Administra la configuración de tu negocio',
}

export default async function SettingsPage() {
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

  const organizationId = orgMember?.organization_id

  if (!organizationId) {
    redirect('/onboarding')
  }

  const [organization, bookingSettings] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organizationId).single(),
    supabase.from('booking_settings').select('*').eq('organization_id', organizationId).single(),
  ])

  return (
    <SettingsClient 
      organization={organization.data} 
      organizationId={organizationId}
      initialBookingSettings={bookingSettings.data}
    />
  )
}
