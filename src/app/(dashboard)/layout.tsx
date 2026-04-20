import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProvider } from '@/components/providers/OrganizationProvider'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError && orgError.code !== 'PGRST116') {
    console.error('Error al obtener contexto de organización:', orgError)
  }

  const organizationId = orgMember?.organization_id ?? null
  const role = orgMember?.role ?? null

  let organizationName: string | null = null
  if (organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()
    organizationName = org?.name ?? null
  }

  return (
    <OrganizationProvider organizationId={organizationId} role={role}>
      <DashboardShell
        role={role}
        organizationId={organizationId}
        organizationName={organizationName}
      >
        {children}
      </DashboardShell>
    </OrganizationProvider>
  )
}
