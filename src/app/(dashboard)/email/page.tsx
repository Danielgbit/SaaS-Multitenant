import { createClient } from '@/lib/supabase/server'
import { EmailSettingsClient } from '@/components/dashboard/email/EmailSettingsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Marketing | Prügressy',
  description: 'Configura emails automáticos de confirmaciones y recordatorios de citas. Mejora la tasa de asistencia de tu negocio con Prügressy.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Email Marketing | Prügressy',
    description: 'Configura emails automáticos para tu negocio de wellness y salud',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Marketing | Prügressy',
    description: 'Configura emails automáticos de confirmaciones y recordatorios',
  },
}

export default async function EmailSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>No autenticado</div>
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const organizationId = orgMember?.organization_id

  if (!organizationId) {
    return <div>No tienes una organización asociada</div>
  }

  return <EmailSettingsClient organizationId={organizationId} />
}
