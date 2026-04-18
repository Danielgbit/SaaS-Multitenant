'use client'

import { useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/actions/auth/resetPassword'
import { Loader2, CheckCircle } from 'lucide-react'
import { PasswordInput } from '@/components/auth/PasswordInput'

type FormState = { error?: string; success?: boolean } | null

const initialState: FormState = null

export function ResetPasswordForm() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(resetPassword, initialState)

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.push('/login?message=password_reset_success')
      }, 1500)
    }
  }, [state?.success, router])

  if (state?.success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          ¡Contraseña actualizada!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Redirigiendo al login...
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <PasswordInput
        name="password"
        id="password"
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        required
        showStrength
      />

      <PasswordInput
        name="confirmPassword"
        id="confirmPassword"
        label="Confirmar contraseña"
        placeholder="Repite la contraseña"
        required
        showStrength={false}
      />

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white font-semibold shadow-lg shadow-[#0F4C5C]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar contraseña'
        )}
      </button>
    </form>
  )
}
