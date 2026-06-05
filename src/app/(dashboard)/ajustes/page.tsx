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

  const initialSettings = bookingSettings.data ? {
    slot_interval: bookingSettings.data.slot_interval ?? 30,
    buffer_minutes: bookingSettings.data.buffer_minutes ?? 0,
    max_days_ahead: bookingSettings.data.max_days_ahead ?? 60,
    min_notice_hours: bookingSettings.data.min_notice_hours ?? 24,
    timezone: bookingSettings.data.timezone ?? 'Europe/Madrid',
    online_booking_enabled: bookingSettings.data.online_booking_enabled ?? true,
    spa_opening_time: bookingSettings.data.spa_opening_time ?? '09:00',
    spa_closing_time: bookingSettings.data.spa_closing_time ?? '20:00',
    auto_retention_days: bookingSettings.data.auto_retention_days ?? 90,
    auto_purge_enabled: bookingSettings.data.auto_purge_enabled ?? false,
  } : null

  return (
    <SettingsClient 
      organization={organization.data} 
      organizationId={organizationId}
      initialBookingSettings={initialSettings}
    />
  )
}
