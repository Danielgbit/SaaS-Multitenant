import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, CalendarClock, Plus, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAvailability } from '@/services/availability/getAvailability'
import { WEEKDAYS } from '@/types/availability'
import { AvailabilityForm } from './AvailabilityForm'
import { AvailabilityList } from './AvailabilityList'

export const metadata = {
  title: 'Configurar Disponibilidad | Gestión de Empleados',
  description: 'Define los días y horarios de trabajo de cada empleado. Optimiza la asignación de citas y la disponibilidad de tu equipo.',
  keywords: ['disponibilidad empleado', 'horarios laborales', 'gestión empleados', 'configuración horario'],
  openGraph: {
    title: 'Configurar Disponibilidad | Gestión de Empleados',
    description: 'Define los días y horarios de trabajo de cada empleado.',
    type: 'website',
  },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AvailabilityPage({ params }: Props) {
  const { id: employeeId } = await params

  const supabase = await createClient()

  // 1. Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Obtener organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    redirect('/calendar')
  }

  // 3. Obtener datos del empleado
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name, organization_id')
    .eq('id', employeeId)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (empError || !employee) {
    redirect('/employees')
  }

  // 4. Obtener disponibilidad actual
  const availability = await getAvailability(employeeId)

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F172A] transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Volver a empleados
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-6 h-6 text-[#0F4C5C] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                Disponibilidad
              </h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Configura los horarios de trabajo de{' '}
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {employee.name}
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* Stats / Summary */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              Días configurados
            </p>
            <p className="text-2xl font-display font-bold text-[#0F4C5C] dark:text-[#38BDF8] mt-1">
              {availability.length}/7
            </p>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              Estado
            </p>
            <p className={`text-lg font-semibold mt-1 ${availability.length > 0 ? 'text-[#16A34A]' : 'text-slate-400'}`}>
              {availability.length > 0 ? 'Activo' : 'Sin configurar'}
            </p>
          </div>
        </div>

        {/* Formulario para agregar horario */}
        <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <Plus className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
              <h2 className="text-lg font-display font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Agregar horario
              </h2>
            </div>
          </div>
          <div className="p-6">
            <AvailabilityForm
              employeeId={employeeId}
              existingAvailability={availability}
            />
          </div>
        </section>

        {/* Lista de horarios configurados */}
        <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
              <h2 className="text-lg font-display font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Horarios configurados
              </h2>
            </div>
          </div>
          <div className="p-6">
            <AvailabilityList
              availability={availability}
              employeeId={employeeId}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
