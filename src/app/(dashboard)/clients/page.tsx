import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClients } from '@/services/clients/getClients'
import { ClientsClient } from './ClientsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clientes — SaaS',
  description: 'Gestiona los clientes de tu organización.',
}

export default async function ClientsPage() {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Obtener organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    redirect('/calendar')
  }

  // 3. Obtener clientes de la organización
  const clients = await getClients(orgMember.organization_id)

  return <ClientsClient clients={clients} organizationId={orgMember.organization_id} />
}
