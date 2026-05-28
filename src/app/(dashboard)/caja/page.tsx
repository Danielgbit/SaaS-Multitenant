import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTodaySession } from '@/actions/cash-sessions/getTodaySession'
import { CashSessionClient } from '@/components/dashboard/cash-session/CashSessionClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Caja del Dia | Pruggressy',
  description: 'Gestion de caja diaria',
}

export default async function CajaPage() {
  const sup = await createClient()
  const { data: { user } } = await sup.auth.getUser()
  if (!user) redirect('/login')
  const { data: m } = await sup.from('organization_members').select('organization_id, role').eq('user_id', user.id).single()
  if (!m) redirect('/calendar')
  const r = await getTodaySession(m.organization_id)
  return (
    <CashSessionClient
      initialSession={r.session ?? null}
      initialEntries={r.entries ?? []}
      organizationId={m.organization_id}
      role={m.role}
      userId={user.id}
    />
  )
}
