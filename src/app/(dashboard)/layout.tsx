import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProvider } from '@/components/providers/OrganizationProvider'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Obtener membresía y rol en la organización
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
      {/* 
        Master Design System Layout 
        Background: #FAFAF9 (Light) / #0F172A (Dark)
      */}
      <div className="flex h-screen bg-[#FAFAF9] dark:bg-[#0F172A] font-sans antialiased selection:bg-[#0F4C5C]/20 dark:selection:bg-[#38BDF8]/30">
        
        {/* Sidebar Navigation */}
        <Sidebar role={role} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Top Header - Glassmorphism */}
          <header className="h-16 flex items-center px-8 flex-shrink-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 transition-colors duration-200">
            <div className="flex items-center gap-3 w-full max-w-[1280px] mx-auto">
              <div 
                className={`w-2.5 h-2.5 rounded-full ${organizationId ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`} 
                aria-hidden="true" 
              />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                {organizationId ? 'Sistemas Operativos conectados' : 'Requiere configuración de organización'}
              </span>
            </div>
          </header>

          {/* Dynamic Page Content */}
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
