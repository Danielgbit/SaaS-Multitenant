'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, UserPlus, CheckCircle, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { acceptInvitation } from '@/actions/invitations/acceptInvitation'
import { setupPasswordAndAccept } from '@/actions/invitations/setupPasswordAndAccept'

function SubmitButton({ children, pending }: { children: React.ReactNode; pending?: boolean }) {
  const { pending: formPending } = useFormStatus()
  const isPending = pending || formPending

  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] active:scale-[0.98] text-white font-semibold shadow-lg shadow-[#0F4C5C]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Procesando...</span>
        </>
      ) : children}
    </button>
  )
}

interface AcceptInvitationFormProps {
  token: string
  invitationEmail?: string | null
  isLoggedIn?: boolean
}

export function AcceptInvitationForm({ token, invitationEmail, isLoggedIn = false }: AcceptInvitationFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSuccess, setLocalSuccess] = useState(false)

  const [setupState, setupAction] = useFormState(setupPasswordAndAccept, null)

  const showExistingUser = setupState?.error?.includes('ya está registrado')

  const handleAccept = async () => {
    setLocalError(null)

    const result = await acceptInvitation(token)

    if (result.error) {
      setLocalError(result.error)
      return
    }

    setLocalSuccess(true)
    setTimeout(() => {
      router.push('/calendar')
      router.refresh()
    }, 1500)
  }

  if (localSuccess || setupState?.success) {
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

  if (showExistingUser) {
    const loginUrl = `/login?email=${encodeURIComponent(invitationEmail || '')}&redirect=${encodeURIComponent(`/invite/${token}`)}`
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Ya tienes una cuenta
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Este correo ya está registrado. Inicia sesión para aceptar la invitación.
              </p>
            </div>
          </div>
        </div>

        <a
          href={loginUrl}
          className="block w-full text-center px-6 py-3 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white font-semibold transition-colors"
        >
          Iniciar sesión
        </a>

        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
          ¿Olvidaste tu contraseña?{' '}
          <a href="/forgot-password" className="text-[#0F4C5C] hover:underline">
            Recupérala aquí
          </a>
        </p>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="space-y-4">
        {(localError || setupState?.error) && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
            <p className="text-sm text-red-600 dark:text-red-400">
              {localError || setupState?.error}
            </p>
          </div>
        )}

        <button
          onClick={handleAccept}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] active:scale-[0.98] text-white font-semibold shadow-lg shadow-[#0F4C5C]/20 transition-all duration-200"
        >
          <UserPlus className="w-5 h-5" />
          <span>Aceptar invitación</span>
        </button>

        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
          Te unirás como {invitationEmail}
        </p>
      </div>
    )
  }

  return (
    <form action={setupAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Crea tu contraseña
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Completa los datos para unirte a la organización
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            id="email"
            type="email"
            value={invitationEmail || ''}
            disabled
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            name="password"
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full pl-12 pr-14 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            name="confirmPassword"
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Repite la contraseña"
            className="w-full pl-12 pr-14 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {setupState?.error && !showExistingUser && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400">
            {setupState.error}
          </p>
        </div>
      )}

      <SubmitButton>
        <Lock className="w-5 h-5" />
        Crear cuenta
      </SubmitButton>

      <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
        Al crear tu cuenta, aceptas unirte a la organización
      </p>
    </form>
  )
}
