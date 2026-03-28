'use client'

import { useActionState } from 'react'
import { Building2, User, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { registerAction } from '@/actions/auth'
import { PasswordInput } from './PasswordInput'

const initialState = {
  error: '',
}

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState)

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="businessName"
          className="text-sm font-semibold text-text-main dark:text-slate-300"
        >
          Nombre del Negocio
        </label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            name="businessName"
            id="businessName"
            type="text"
            required
            placeholder="Ej. Spa & Relax"
            autoComplete="organization"
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="fullName"
          className="text-sm font-semibold text-text-main dark:text-slate-300"
        >
          Tu Nombre
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            name="fullName"
            id="fullName"
            type="text"
            required
            placeholder="Juan Pérez"
            autoComplete="name"
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
          />
        </div>
      </div>

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
        placeholder="Crea una contraseña segura"
        required
        showStrength
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creando...</span>
          </>
        ) : (
          <>
            <span>Crear Cuenta</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  )
}
