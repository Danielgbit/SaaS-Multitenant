'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'
import Link from 'next/link'

const initialState = {
  error: '',
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState)

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="p-3 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {state.error}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold tracking-wide uppercase" htmlFor="email">
          Correo Electrónico
        </label>
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-4 text-slate-400 pointer-events-none">mail</span>
          <input 
            name="email"
            id="email" 
            type="email" 
            required 
            placeholder="ejemplo@correo.com" 
            className="form-input w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base" 
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold tracking-wide uppercase" htmlFor="password">
          Contraseña
        </label>
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-4 text-slate-400 pointer-events-none">lock</span>
          <input 
            name="password"
            id="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            className="form-input w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base" 
          />
        </div>
      </div>

      <div className="flex justify-end mt-1">
        <Link href="/forgot-password" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">¿Olvidaste tu contraseña?</Link>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-semibold py-3 sm:py-4 px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? 'Iniciando...' : 'Iniciar Sesión'}
        {!isPending && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
      </button>
    </form>
  )
}
