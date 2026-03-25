import { notFound } from 'next/navigation'
import { verifyInvitation } from '@/actions/invitations/verifyInvitation'
import { AcceptInvitationForm } from './AcceptInvitationForm'
import { createClient } from '@/lib/supabase/server'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params

  if (!token) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await verifyInvitation(token)

  if (result.error || !result.invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-serif">
            Invitación inválida
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {result.error || 'Error desconocido'}
          </p>
          <a
            href="/login"
            className="inline-block mt-6 px-6 py-3 bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white font-semibold rounded-xl transition-colors"
          >
            Ir a inicio de sesión
          </a>
        </div>
      </div>
    )
  }

  const invitation = result.invitation

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F4C5C]/5 via-slate-50 to-slate-100 dark:from-[#0F4C5C]/10 dark:via-slate-900 dark:to-slate-800 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] shadow-lg shadow-[#0F4C5C]/20 mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-2">
            Te han invitado
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Has recibido una invitación para unirte a <span className="font-semibold text-[#0F4C5C] dark:text-[#38BDF8]">{invitation.organization_name}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center text-[#0F4C5C] dark:text-[#38BDF8] font-bold text-lg">
                {invitation.employee_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {invitation.employee_name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Rol: <span className="capitalize">{invitation.role}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <AcceptInvitationForm 
              token={token} 
              invitationEmail={invitation.email}
              isLoggedIn={!!user}
            />
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6">
          Esta invitación expira el {new Date(invitation.expires_at).toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>
    </div>
  )
}
