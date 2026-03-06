'use client'

import { useOrganization } from '@/components/providers/OrganizationProvider'
import { logoutAction } from '@/actions/auth'

export default function CalendarPage() {
  const { organizationId, role } = useOrganization()

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-glass dark:shadow-glass-dark border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-serif font-bold text-primary mb-2">
          Bienvenido a tu Espacio B2B
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-display">
          Has iniciado sesión correctamente y tu contexto multitenant ha sido inyectado.
        </p>

        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <ul className="space-y-2 font-mono text-sm">
            <li><strong>Organization ID:</strong> {organizationId || 'Cargando...'}</li>
            <li><strong>Tu Rol:</strong> <span className="uppercase text-primary font-bold">{role || 'Cargando...'}</span></li>
          </ul>
        </div>
        
        <form action={logoutAction} className="mt-8">
          <button type="submit" className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-full font-semibold transition-colors text-sm flex items-center gap-2">
             <span className="material-symbols-outlined text-lg">logout</span>
             Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}
