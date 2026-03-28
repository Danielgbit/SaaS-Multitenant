'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { loginAction } from '@/actions/auth'
import { PasswordInput } from './PasswordInput'
import Link from 'next/link'

const initialState = {
  error: '',
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const emailParam = searchParams.get('email')

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="redirect_to" value={redirectTo || '/calendar'} />

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold text-text-main dark:text-slate-300"
        >
          Correo Electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            name="email"
            id="email"
            type="email"
            required
            defaultValue={emailParam || ''}
            placeholder="tu@correo.com"
            autoComplete="email"
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
          />
        </div>
      </div>

      <PasswordInput
        name="password"
        id="password"
        label="Contraseña"
        placeholder="••••••••"
        required
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:text-primary/80 dark:text-[#38BDF8] dark:hover:text-[#38BDF8]/80 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Iniciando...</span>
          </>
        ) : (
          <>
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  )
}
