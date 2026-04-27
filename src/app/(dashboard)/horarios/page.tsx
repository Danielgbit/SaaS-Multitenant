import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HorariosClient } from './HorariosClient'
import { getSpaOverrides } from '@/services/availability/getSpaOverrides'
import { getEmployeesWithOverrides } from '@/services/availability/getEmployeesWithOverrides'

export const metadata = {
  title: 'Horarios - Prügressy',
  description: 'Configura el horario del spa y la disponibilidad de tu equipo.',
}

export default async function HorariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember?.organization_id) {
    redirect('/onboarding')
  }

  if (orgMember.role === 'empleado') {
    redirect('/calendar')
  }

  const organizationId = orgMember.organization_id

  const [spaOverrides, employees, bookingSettings] = await Promise.all([
    getSpaOverrides(organizationId),
    getEmployeesWithOverrides(organizationId),
    supabase.from('booking_settings').select('spa_opening_time, spa_closing_time')
      .eq('organization_id', organizationId).single(),
  ])

  return (
    <HorariosClient
      organizationId={organizationId}
      spaHours={{
        spa_opening_time: bookingSettings.data?.spa_opening_time || '09:00',
        spa_closing_time: bookingSettings.data?.spa_closing_time || '20:00',
      }}
      spaOverrides={spaOverrides}
      employees={employees}
    />
  )
}