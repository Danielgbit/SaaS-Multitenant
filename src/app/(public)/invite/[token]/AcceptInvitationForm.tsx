'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, CheckCircle } from 'lucide-react'
import { acceptInvitation } from '@/actions/invitations/acceptInvitation'

interface AcceptInvitationFormProps {
  token: string
  invitationEmail?: string | null
}

export function AcceptInvitationForm({ token, invitationEmail }: AcceptInvitationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAccept = async () => {
    setIsLoading(true)
    setError(null)

    const result = await acceptInvitation(token)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
    
    setTimeout(() => {
      router.push('/calendar')
      router.refresh()
    }, 1500)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
          ¡Bienvenido!
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Redirigiendo al dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={isLoading}
        className="
          w-full flex items-center justify-center gap-2
          px-6 py-3 rounded-xl
          bg-[#0F4C5C] hover:bg-[#0C3E4A] active:scale-[0.98]
          text-white font-semibold
          shadow-lg shadow-[#0F4C5C]/20
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Aceptando...</span>
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            <span>Aceptar invitación</span>
          </>
        )}
      </button>

      <p className="text-xs text-center text-slate-400 dark:text-slate-500">
        Al aceptar, crearás una cuenta o iniciarás sesión y te unirás a la organización.
      </p>
    </div>
  )
}
