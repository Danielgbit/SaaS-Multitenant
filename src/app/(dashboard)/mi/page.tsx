import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MiDashboard } from '@/components/employee/MiDashboard'

export default async function MiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/login')

  // Fetch employee linked to this user
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (!employee) {
    return (
      <div className="p-8 text-center text-[#64748B] dark:text-slate-400">
        <p className="text-lg font-medium mb-2">No tienes un perfil de empleado</p>
        <p className="text-sm">Contacta al administrador de tu organización.</p>
      </div>
    )
  }

  // Fetch availability
  const { data: availability } = await supabase
    .from('employee_availability')
    .select('*')
    .eq('employee_id', employee.id)
    .order('day_of_week')

  // Fetch employee services with service details
  const { data: empServices } = await supabase
    .from('employee_services')
    .select('service_id, services(name, duration, price)')
    .eq('employee_id', employee.id)

  // Fetch upcoming appointments (today + next 7 days)
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfToday)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, status, clients(name)')
    .eq('employee_id', employee.id)
    .not('status', 'in', '("cancelled","no_show")')
    .gte('start_time', startOfToday.toISOString())
    .lt('start_time', endOfWeek.toISOString())
    .order('start_time')

  // Parse services
  const services = (empServices ?? [])
    .map((es: any) => es.services)
    .filter(Boolean)

  return (
    <MiDashboard
      employee={employee}
      availability={availability ?? []}
      services={services}
      appointments={appointments ?? []}
    />
  )
}
