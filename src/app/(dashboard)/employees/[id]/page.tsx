import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEmployeeWithDetails } from '@/services/employees/getEmployeeWithDetails'
import { getServices } from '@/services/services/getServices'
import { getEmployeeServices } from '@/services/employees/getEmployeeServices'
import { EmployeeTabs } from './EmployeeTabs'
import { getPendingInvitations } from '@/actions/invitations/getInvitations'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { title: 'Empleado' }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) return { title: 'Empleado' }

  const { data: employee } = await supabase
    .from('employees')
    .select('name')
    .eq('id', id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  return {
    title: employee ? `${employee.name} — Empleados` : 'Empleado no encontrado',
  }
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id: employeeId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    redirect('/calendar')
  }

  const employee = await getEmployeeWithDetails(employeeId, orgMember.organization_id)
  if (!employee) {
    redirect('/employees')
  }

  const services = await getServices(orgMember.organization_id)
  const employeeServices = await getEmployeeServices(employeeId)
  
  const { invitations } = await getPendingInvitations(orgMember.organization_id)
  const pendingInvitation = invitations?.find((inv: any) => inv.employee_id === employeeId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Volver a empleados
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-[#0F4C5C]/20 dark:shadow-none">
                <span className="text-2xl font-bold text-white">
                  {employee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 
                  className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {employee.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    employee.active 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${employee.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {employee.active ? 'Activo' : 'Inactivo'}
                  </span>
                  {employee.user_id && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Acceso al sistema
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <EmployeeTabs 
          employee={employee}
          allServices={services}
          employeeServices={employeeServices}
          pendingInvitation={pendingInvitation}
          organizationId={orgMember.organization_id}
          currentUserRole={orgMember.role}
        />
      </div>
    </div>
  )
}
