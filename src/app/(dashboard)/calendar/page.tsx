import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Scissors, ArrowRight, CalendarDays, CheckCircle2 } from 'lucide-react'
import { CalendarView } from '@/components/dashboard/CalendarView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agenda & Calendario — Prügressy',
  description: 'Gestión inteligente de citas y disponibilidad para tu centro de bienestar.',
  robots: { index: false, follow: false }, // Privado detrás del login
}

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const organizationId = orgMember?.organization_id

  let employeesCount = 0
  let servicesCount = 0

  if (organizationId) {
    const [{ count: empCount }, { count: srvCount }] = await Promise.all([
      supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
    ])
    employeesCount = empCount ?? 0
    servicesCount = srvCount ?? 0
  }

  const needsOnboarding = employeesCount === 0 || servicesCount === 0

  // ── ONBOARDING STATE ──
  if (needsOnboarding) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4 sm:px-6">
        
        {/* Header / Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0F4C5C]/10 to-transparent dark:from-[#38BDF8]/10 dark:via-[#38BDF8]/5 dark:to-transparent mb-8 shadow-sm border border-[#0F4C5C]/5 dark:border-[#38BDF8]/10">
            <CalendarDays className="w-10 h-10 text-[#0F4C5C] dark:text-[#38BDF8]" />
          </div>
          {/* SEO: H1 de la vista */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-serif mb-4">
            Prepara tu espacio
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Completa esta configuración mínima para desbloquear el calendario interactivo y comenzar a agendar citas.
          </p>
        </div>

        {/* Pasos / Cards (Grid Desktop, Stack Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Línea conectora visual (sólo desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[calc(50%-1.5rem)] w-12 h-[2px] bg-slate-100 dark:bg-slate-800 -z-10" aria-hidden="true" />

          {/* Paso 1: Equipo */}
          <div
            className={`
              relative p-8 rounded-2xl border shadow-sm transition-all duration-300
              ${employeesCount > 0
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/60 hover:shadow-md'
              }
            `}
          >
            {employeesCount > 0 && (
               <div className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400">
                 <CheckCircle2 className="w-6 h-6" />
               </div>
            )}
            
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${employeesCount > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              <Users className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-2">
              1. Equipo de trabajo
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 min-h-[60px]">
              {employeesCount > 0
                ? `¡Excelente! Tienes ${employeesCount} profesional${employeesCount !== 1 ? 'es' : ''} listo${employeesCount !== 1 ? 's' : ''} para asociar al calendario.`
                : 'Añade al menos un profesional. El calendario se construye basándose en su disponibilidad.'}
            </p>
            
            {employeesCount === 0 ? (
              <Link
                href="/employees"
                className="group flex items-center justify-between w-full px-5 py-3.5 min-h-[44px] rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2"
              >
                Agregar empleados
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <div className="px-5 py-3.5 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex justify-center border border-emerald-200/50 dark:border-emerald-800/30">
                Paso completado
              </div>
            )}
          </div>

          {/* Paso 2: Servicios */}
          <div
            className={`
              relative p-8 rounded-2xl border shadow-sm transition-all duration-300
              ${servicesCount > 0
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/60 hover:shadow-md'
              }
            `}
          >
            {servicesCount > 0 && (
               <div className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400">
                 <CheckCircle2 className="w-6 h-6" />
               </div>
            )}
            
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${servicesCount > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              <Scissors className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-2">
              2. Catálogo de servicios
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 min-h-[60px]">
              {servicesCount > 0
                ? `Tienes ${servicesCount} servicio${servicesCount !== 1 ? 's' : ''} configurado${servicesCount !== 1 ? 's' : ''}.`
                : 'Define los tratamientos o servicios que ofreces, su duración y costo.'}
            </p>
            
            {servicesCount === 0 ? (
              <Link
                href="/services"
                className="group flex items-center justify-between w-full px-5 py-3.5 min-h-[44px] rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2"
              >
                Agregar servicios
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <div className="px-5 py-3.5 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex justify-center border border-emerald-200/50 dark:border-emerald-800/30">
                Paso completado
              </div>
            )}
          </div>
        </div>

      </div>
    )
  }

  // ── ACTIVE STATE (CALENDAR UI) ──
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
         <div>
           <p className="text-xs font-semibold uppercase tracking-widest text-[#0F4C5C] dark:text-[#38BDF8] mb-1">
             Gestión operativa
           </p>
           {/* SEO: Un H1 natural */}
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-serif">
             Agenda diaria
           </h1>
         </div>
         <p className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
            {employeesCount} Empleados • {servicesCount} Servicios
         </p>
      </div>
      
      {/* Calendario semanal */}
      {organizationId && (
        <CalendarView organizationId={organizationId} />
      )}
    </div>
  )
}
