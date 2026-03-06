import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProvider } from '@/components/providers/OrganizationProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch User's Organization mapping
  // We use .single() assuming 1 organization per user.
  // If multitenant allows multiple orgs per user, we would fetch a list and have an active org picker.
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  // 3. Optional: redirect to onboarding if no organization exists (maybe trigger hasn't finished yet or edge case)
  if (orgError && orgError.code !== 'PGRST116') {
     // PGRST116 = no rows returned
     console.error("Failed to fetch organization context:", orgError)
  }

  const organizationId = orgMember?.organization_id ?? null
  const role = orgMember?.role ?? null

  return (
    <OrganizationProvider organizationId={organizationId} role={role}>
      <div className="flex h-screen bg-background-light dark:bg-background-dark">
        {/* Placeholder Sidebar */}
        <aside className="w-64 border-r border-border-color dark:border-slate-800 bg-white dark:bg-[#151b1d] hidden md:block">
          <div className="p-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2 font-display">
              <span className="material-symbols-outlined">spa</span>
              SaaS
            </h2>
            <p className="text-xs text-text-muted mt-2 uppercase tracking-wider font-semibold">
              Rol: {role || 'No asignado'}
            </p>
          </div>
          {/* Menu links would go here */}
        </aside>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Placeholder Top Header */}
          <header className="h-16 border-b border-border-color dark:border-slate-800 bg-white/50 backdrop-blur-md dark:bg-[#151b1d]/50 flex items-center justify-between px-6">
            <h1 className="font-serif text-xl font-semibold">Dashboard</h1>
          </header>

          <main className="flex-1 overflow-y-auto p-6 relative">
             {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  )
}
