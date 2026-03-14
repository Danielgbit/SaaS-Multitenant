import { createClient } from '@/lib/supabase/server'
import { WhatsAppSettingsClient } from '@/components/dashboard/whatsapp/WhatsAppSettingsClient'

export default async function WhatsAppSettingsPage() {
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

  return <WhatsAppSettingsClient organizationId={organizationId} />
}
