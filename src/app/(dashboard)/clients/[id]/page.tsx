import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientById } from '@/services/clients/getClients'
import { getAppointmentsByClient } from '@/services/appointments/getAppointments'
import { ClientTabs } from './ClientTabs'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { title: 'Cliente' }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) return { title: 'Cliente' }

  const client = await getClientById(id)

  return {
    title: client ? `${client.name} — Clientes` : 'Cliente no encontrado',
  }
}

export default async function ClientDetailPage({ params }: Props) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    redirect('/calendar')
  }

  const client = await getClientById(clientId)
  if (!client) {
    redirect('/clients')
  }

  const appointments = await getAppointmentsByClient(clientId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ClientTabs 
          client={client}
          appointments={appointments}
          organizationId={orgMember.organization_id}
        />
      </div>
    </div>
  )
}
