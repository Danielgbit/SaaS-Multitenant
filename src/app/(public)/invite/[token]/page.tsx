import { notFound } from 'next/navigation'
import { verifyInvitation, type InvitationErrorType } from '@/actions/invitations/verifyInvitation'
import { AcceptInvitationForm } from './AcceptInvitationForm'
import { createClient } from '@/lib/supabase/server'
import { getRoleLabel } from '@/lib/rbac'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

const errorConfig: Record<InvitationErrorType, { title: string; description: string; iconColor: string; bgColor: string }> = {
  invalid_token: {
    title: 'Invitación no válida',
    description: 'El enlace de esta invitación no es válido. Verifica que hayas copiado el enlace completo.',
    iconColor: 'text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  not_found: {
    title: 'Invitación no encontrada',
    description: 'No se encontró ninguna invitación con este enlace. Puede que ya haya sido eliminada.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  already_accepted: {
    title: 'Invitación ya utilizada',
    description: 'Esta invitación ya fue aceptada anteriormente. Puedes iniciar sesión con tu cuenta.',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  cancelled: {
    title: 'Invitación cancelada',
    description: 'Esta invitación fue cancelada por el administrador. Contacta al equipo si crees que es un error.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  expired: {
    title: 'Invitación expirada',
    description: 'Esta invitación ha perdido su validez. Contacta al administrador para solicitar una nueva.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
}

function BrokenLinkIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="#f1f5f9" />
      <path d="M45 45L75 75" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 6" />
      <path d="M75 45L45 75" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="40" r="6" fill="#cbd5e1" />
      <circle cx="80" cy="80" r="6" fill="#cbd5e1" />
      <circle cx="80" cy="40" r="4" fill="#e2e8f0" />
      <circle cx="40" cy="80" r="4" fill="#e2e8f0" />
    </svg>
  )
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
    const errorType = result.errorType || 'not_found'
    const config = errorConfig[errorType]

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-12">
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <BrokenLinkIllustration className="w-full h-full" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3 font-serif tracking-tight">
                {config.title}
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                {config.description}
              </p>

              <div className="space-y-3">
                <a
                  href="/"
                  className="block w-full px-6 py-3.5 bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4a] hover:from-[#0a3d4a] hover:to-[#062c38] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#0F4C5C]/20 hover:shadow-xl hover:shadow-[#0F4C5C]/30 text-center"
                >
                  Ir al inicio
                </a>
                
                <a
                  href="/login"
                  className="block w-full px-6 py-3.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium rounded-xl transition-all duration-200 text-center"
                >
                  Volver al login
                </a>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">¿Necesitas ayuda?</p>
                <a 
                  href="mailto:soporte@focusidestudio.com" 
                  className="inline-flex items-center gap-1.5 text-sm text-[#0F4C5C] hover:text-[#0a3d4a] dark:text-[#38BDF8] dark:hover:text-[#0ea5e9] font-medium transition-colors"
                >
                  Contactar soporte
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-[#0F4C5C] dark:text-[#38BDF8]">Prügressy</span>
                  <span className="text-lg font-bold text-[#5eead4]">.</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Gestión inteligente de tu negocio</p>
              </div>
            </div>
          </div>
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-6">
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
                  Rol: <span className="font-medium text-[#0F4C5C] dark:text-[#38BDF8]">{getRoleLabel(invitation.role)}</span>
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
