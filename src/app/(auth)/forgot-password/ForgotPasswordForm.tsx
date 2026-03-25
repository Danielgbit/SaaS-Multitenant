'use client'

import { useFormState } from 'react-dom'
import { sendPasswordResetEmail } from '@/actions/auth/sendPasswordResetEmail'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

type FormState = { error?: string; success?: boolean } | null

const initialState: FormState = null

export function ForgotPasswordForm() {
  const [state, action, isPending] = useFormState(sendPasswordResetEmail, initialState)

  if (state?.success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Revisa tu correo
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Te enviamos un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            name="email"
            id="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C5C]/20 focus:border-[#0F4C5C] transition-colors placeholder:text-slate-400"
          />
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
            Enviando...
          </>
        ) : (
          'Enviar enlace'
        )}
      </button>
    </form>
  )
}
