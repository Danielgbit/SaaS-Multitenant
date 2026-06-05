import { createClient } from '@/lib/supabase/server'
import { AlertTriangle } from 'lucide-react'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let reason = 'Contacta al soporte de Prügressy.'

  if (user) {
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgMember?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('status_reason')
        .eq('id', orgMember.organization_id)
        .single()

      if (org?.status_reason) reason = org.status_reason
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#151b1d] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#DC2626]/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-white font-heading">
          Organización Suspendida
        </h1>
        <p className="text-[#475569] dark:text-slate-400">
          {reason}
        </p>
        <p className="text-sm text-[#94A3B8]">
          Si crees que esto es un error, contacta al administrador de tu plataforma.
        </p>
      </div>
    </div>
  )
}
