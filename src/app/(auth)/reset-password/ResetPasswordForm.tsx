'use client'

import { useState, useEffect } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/actions/auth/resetPassword'
import { Loader2, Lock, CheckCircle } from 'lucide-react'

type FormState = { error?: string; success?: boolean } | null

const initialState: FormState = null

export function ResetPasswordForm() {
  const router = useRouter()
  const [state, action, isPending] = useFormState(resetPassword, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Nueva contraseña
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
            className="w-full pl-12 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? 'visibility_off' : 'visibility'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
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
            className="w-full pl-12 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirmPassword ? 'visibility_off' : 'visibility'}
          </button>
        </div>
      </div>

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
