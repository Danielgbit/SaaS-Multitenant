import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MiDashboard } from '@/components/employee/MiDashboard'
import { getMyMetrics } from '@/actions/employee/getMyMetrics'
import { getMyHistory } from '@/actions/employee/getMyHistory'
import { getMyUpcoming } from '@/actions/employee/getMyUpcoming'

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

  const [availResult, servicesResult] = await Promise.all([
    supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week'),
    supabase
      .from('employee_services')
      .select('service_id, services(name, duration, price)')
      .eq('employee_id', employee.id),
  ])

  const [metricsResult, historyResult, upcomingResult] = await Promise.all([
    getMyMetrics(),
    getMyHistory(),
    getMyUpcoming(),
  ])

  const availability = availResult.data ?? []
  const rawServices = servicesResult.data ?? []
  const services = rawServices
    .map((es: any) => es.services)
    .filter(Boolean)

  return (
    <MiDashboard
      employee={employee}
      availability={availability}
      services={services}
      appointments={upcomingResult.data ?? []}
      metrics={metricsResult.data ?? {
        completedThisMonth: 0,
        revenueThisMonth: 0,
        completionRate: 0,
        streak: 0,
        noShowRate: 0,
        pendingLoans: 0,
        cancelledThisMonth: 0,
      }}
      history={historyResult.data ?? []}
    />
  )
}
