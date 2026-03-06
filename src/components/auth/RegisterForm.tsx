'use client'

import { useActionState } from 'react'
import { registerAction } from '@/actions/auth'
import Link from 'next/link'

const initialState = {
  error: '',
}

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState)

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="p-3 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessName" className="text-sm font-semibold text-text-main dark:text-slate-200">
          Nombre del Negocio
        </label>
        <input 
          name="businessName"
          id="businessName" 
          type="text" 
          required 
          placeholder="Ej. Spa & Relax" 
          className="form-input w-full rounded-lg border border-border-color dark:border-slate-700 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-text-muted/60 dark:placeholder:text-slate-500 font-display text-base" 
        />
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-semibold text-text-main dark:text-slate-200">
          Nombre Completo
        </label>
        <input 
          name="fullName"
          id="fullName" 
          type="text" 
          required 
          placeholder="Tu nombre" 
          className="form-input w-full rounded-lg border border-border-color dark:border-slate-700 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-text-muted/60 dark:placeholder:text-slate-500 font-display text-base" 
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-text-main dark:text-slate-200">
          Correo Electrónico
        </label>
        <input 
          name="email"
          id="email" 
          type="email" 
          required 
          placeholder="ejemplo@correo.com" 
          className="form-input w-full rounded-lg border border-border-color dark:border-slate-700 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-text-muted/60 dark:placeholder:text-slate-500 font-display text-base" 
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-text-main dark:text-slate-200">
          Contraseña
        </label>
        <div className="relative">
          <input 
            name="password"
            id="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            className="form-input w-full rounded-lg border border-border-color dark:border-slate-700 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-text-muted/60 dark:placeholder:text-slate-500 font-display text-base" 
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined text-xl">visibility_off</span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark font-display text-base disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creando...' : 'Crear Cuenta'}
        </button>
      </div>
    </form>
  )
}
