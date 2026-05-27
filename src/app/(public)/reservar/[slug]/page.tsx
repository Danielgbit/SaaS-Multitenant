import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingWizard } from '@/components/public/BookingWizard'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params
  
  const supabase = await createClient()

  // Obtener organización por slug
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (error || !organization) {
    notFound()
  }

  let services: any[] | null = []
  let employees: any[] | null = []
  let availabilities: { employee_id: string; day_of_week: number }[] = []

  try {
    const [servicesResult, employeesResult] = await Promise.all([
      supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('organization_id', organization.id)
        .eq('active', true)
        .order('name'),
      supabase
        .from('employees')
        .select('id, name')
        .eq('organization_id', organization.id)
        .eq('active', true)
        .order('name'),
    ])

    services = servicesResult.data || []
    employees = employeesResult.data || []

    const employeeIds = employees.map(e => e.id)
    if (employeeIds.length > 0) {
      const { data: avail } = await supabase
        .from('employee_availability')
        .select('employee_id, day_of_week')
        .in('employee_id', employeeIds)

      availabilities = avail || []
    }
  } catch {
    // Graceful degradation on fetch failure
  }

  // Filtrar empleados que tienen al menos un día de disponibilidad
  const availableEmployeeIds = new Set(availabilities.map(a => a.employee_id))
  const employeesWithAvailability = employees?.filter(e => availableEmployeeIds.has(e.id)) || []

  if (!services || services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="text-center px-6">
          <h1 className="text-2xl font-semibold mb-2 font-heading" style={{ color: '#1A2B32' }}>
            {organization.name}
          </h1>
          <p style={{ color: '#5A6B70' }}>
            No hay servicios disponibles en este momento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <BookingWizard 
        organization={organization}
        services={services}
        employees={employeesWithAvailability}
      />
    </div>
  )
}
