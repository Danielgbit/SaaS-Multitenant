import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServices } from '@/services/services/getServices'
import { ServicesClient } from './ServicesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Servicios — Prügressy',
  description: 'Gestión del catálogo de servicios.',
  robots: { index: false, follow: false },
}

export default async function ServicesPage() {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Organization context
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember?.organization_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-serif mb-2">
          Organización no encontrada
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Por favor, configura tu centro de negocios para acceder a este módulo.
        </p>
      </div>
    )
  }

  // 3. Data Fetching (Server-Side)
  // Utilizamos la URL con el org-ID en la RLS rules o explícitamente en el fetch.
  const services = await getServices(orgMember.organization_id)

  // 4. Render Client Wrapper
  return (
    <div className="animate-in fade-in duration-500">
      <ServicesClient services={services} />
    </div>
  )
}
