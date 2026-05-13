import { createClient } from '@/lib/supabase/server'
import { WhatsAppModuleClient } from '@/components/dashboard/whatsapp/WhatsAppModuleClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WhatsApp | Prügressy',
  description: 'Gestiona tus mensajes de WhatsApp, plantillas y automatizaciones de notificaciones para tu negocio de wellness y salud.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'WhatsApp | Prügressy',
    description: 'Gestiona mensajes y automatizaciones de WhatsApp para tu negocio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp | Prügressy',
    description: 'Gestiona mensajes y automatizaciones de WhatsApp',
  },
}

export default async function WhatsAppPage() {
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

  return <WhatsAppModuleClient organizationId={organizationId} />
}