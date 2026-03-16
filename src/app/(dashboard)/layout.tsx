import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProvider } from '@/components/providers/OrganizationProvider'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'

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

  return (
    <OrganizationProvider organizationId={organizationId} role={role}>
      <div className="flex h-screen bg-[#FAFAF9] dark:bg-[#0F172A] font-sans antialiased selection:bg-[#0F4C5C]/20 dark:selection:bg-[#38BDF8]/30">
        
        <Sidebar role={role} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header organizationConnected={!!organizationId} />

          <main className="flex-1 overflow-y-auto w-full scroll-smooth">
            <div className="w-full max-w-[1280px] mx-auto p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>

        </div>
      </div>
    </OrganizationProvider>
  )
}
