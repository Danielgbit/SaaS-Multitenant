'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateSlots } from '@/services/slots/generateSlots'
import { queueWhatsAppMessage } from '@/actions/whatsapp/whatsApp'
import { queueEmailMessage } from '@/actions/email/queueEmailMessage'

// =============================================================================
// SCHEMA DE VALIDACIÓN
// =============================================================================

const PublicBookingSchema = z.object({
  organizationSlug: z.string().min(1),
  serviceId: z.string().uuid('ID de servicio inválido'),
  employeeId: z.string().uuid('ID de empleado inválido'),
  clientName: z.string().min(2, 'Nombre muy corto'),
  clientPhone: z.string().min(8, 'Teléfono inválido'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  startTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Fecha inválida'),
  notes: z.string().optional(),
})

type PublicBookingInput = z.infer<typeof PublicBookingSchema>

// =============================================================================
// HELPER: Obtener organización por slug
// =============================================================================

async function getOrganizationBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// =============================================================================
// HELPER: Buscar o crear cliente
// =============================================================================

async function findOrCreateClient(
  organizationId: string,
  name: string,
  phone: string,
  email?: string
) {
  const supabase = await createClient()

  // Buscar cliente existente por teléfono
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('phone', phone)
    .single()

  if (existingClient) {
    return existingClient.id
  }

  // Crear nuevo cliente
  const { data: newClient, error: insertError } = await supabase
    .from('clients')
    .insert({
      organization_id: organizationId,
      name,
      phone,
      email: email || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating client:', insertError)
    throw new Error('Error al registrar cliente')
  }

  return newClient.id
}

// =============================================================================
// SERVER ACTION
// =============================================================================

/**
 * Crea una reserva pública sin necesidad de autenticación.
 * 
 * @param input - Datos de la reserva
 * @returns Error si falla, success si se crea correctamente
 */
export async function createPublicBooking(
  input: PublicBookingInput
): Promise<{ error?: string; success?: boolean; appointmentId?: string; organizationName?: string }> {
  // 1. Validar input con Zod
  const parsed = PublicBookingSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || 'Datos inválidos' }
  }

  const { organizationSlug, serviceId, employeeId, clientName, clientPhone, clientEmail, startTime, notes } = parsed.data

  const supabase = await createClient()

  // 2. Obtener organización por slug
  const organization = await getOrganizationBySlug(organizationSlug)

  if (!organization) {
    return { error: 'Organización no encontrada' }
  }

  const organizationId = organization.id

  // 3. Verificar que el empleado existe y pertenece a la org
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id, active, name')
    .eq('id', employeeId)
    .eq('organization_id', organizationId)
    .single()

  if (empError || !employee) {
    return { error: 'El profesional no existe' }
  }

  if (!employee.active) {
    return { error: 'El profesional no está disponible' }
  }

  // 4. Verificar que el servicio existe y pertenece a la org
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, organization_id, active, name, duration, price')
    .eq('id', serviceId)
    .eq('organization_id', organizationId)
    .single()

  if (serviceError || !service) {
    return { error: 'El servicio no existe' }
  }

  if (!service.active) {
    return { error: 'El servicio no está disponible' }
  }

  // 5. Calcular hora de fin
  const startDate = new Date(startTime)
  const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000)

  // 6. VERIFICAR DISPONIBILIDAD
  const dateStr = startTime.split('T')[0]

  try {
    const availableSlots = await generateSlots({
      employeeId,
      serviceId,
      date: dateStr,
      organizationId,
    })

    const slotAvailable = availableSlots.some(
      (slot) =>
        slot.available &&
        new Date(slot.start_time).getTime() === startDate.getTime()
    )

    if (!slotAvailable) {
      return { error: 'El horario ya no está disponible. Por favor selecciona otro.' }
    }
  } catch (genError) {
    console.error('Error verifying slot availability:', genError)
    return { error: 'Error al verificar disponibilidad.' }
  }

  // 7. Buscar o crear cliente
  let clientId: string
  try {
    clientId = await findOrCreateClient(
      organizationId,
      clientName,
      clientPhone,
      clientEmail
    )
  } catch (e) {
    return { error: 'Error al registrar tus datos. Intenta de nuevo.' }
  }

  // 8. Crear la cita
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      employee_id: employeeId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: 'pending',
      notes: notes || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating appointment:', insertError)
    return { error: 'Error al crear la cita. Intenta de nuevo.' }
  }

  // 9. Crear la relación appointment_services
  await supabase
    .from('appointment_services')
    .insert({
      appointment_id: appointment.id,
      service_id: serviceId,
    })

  // 10. Encolar mensaje de WhatsApp si está configurado
  try {
    const { data: whatsappSettings } = await (supabase as any)
      .from('whatsapp_settings')
      .select('enabled')
      .eq('organization_id', organizationId)
      .single()

    if (whatsappSettings?.enabled && clientPhone) {
      await queueWhatsAppMessage({
        organizationId,
        appointmentId: appointment.id,
        phone: clientPhone,
        template: 'appointment_confirmation',
        variables: {
          name: clientName,
          date: startDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          time: startDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      })
    }

    if (clientEmail) {
      const { data: emailSettings } = await (supabase as any)
        .from('email_settings')
        .select('enabled, send_confirmation')
        .eq('organization_id', organizationId)
        .single()

      if (emailSettings?.enabled && emailSettings?.send_confirmation) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('name')
          .eq('id', employeeId)
          .single()

        await queueEmailMessage({
          organizationId,
          appointmentId: appointment.id,
          emailType: 'appointment_confirmation',
          to: clientEmail,
          variables: {
            businessName: organization.name,
            clientName: clientName,
            serviceName: service?.name || 'Servicio',
            employeeName: employeeData?.name || 'Profesional',
            date: startDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
            time: startDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duration: `${service?.duration || 30} min`,
            price: service?.price ? `${service.price}€` : undefined,
          },
        })
      }
    }
  } catch (notificationError) {
    console.error('Error sending notifications:', notificationError)
  }

  // 11. Revalidar paths
  revalidatePath('/calendar')

  return { 
    success: true, 
    appointmentId: appointment.id,
    organizationName: organization.name
  }
}

// =============================================================================
// HELPER: Obtener servicios activos para booking público
// =============================================================================

export async function getPublicServices(organizationSlug: string) {
  const organization = await getOrganizationBySlug(organizationSlug)
  
  if (!organization) {
    return { error: 'Organización no encontrada' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration, price')
    .eq('organization_id', organization.id)
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching services:', error)
    return { error: 'Error al cargar servicios' }
  }

  return { services: data, organization }
}

// =============================================================================
// HELPER: Obtener empleados con disponibilidad para un servicio
// =============================================================================

export async function getPublicEmployees(organizationSlug: string, serviceId: string) {
  const organization = await getOrganizationBySlug(organizationSlug)
  
  if (!organization) {
    return { error: 'Organización no encontrada' }
  }

  const supabase = await createClient()

  // Obtener empleados activos de la org
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, organization_id')
    .eq('organization_id', organization.id)
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching employees:', error)
    return { error: 'Error al cargar profesionales' }
  }

  // Filtrar empleados que tienen disponibilidad (tienen al menos un registro en employee_availability)
  const employeeIds = employees.map(e => e.id)
  
  if (employeeIds.length === 0) {
    return { employees: [] }
  }

  const { data: availabilities } = await supabase
    .from('employee_availability')
    .select('employee_id')
    .in('employee_id', employeeIds)

  const availableEmployeeIds = new Set(availabilities?.map(a => a.employee_id) || [])
  
  const employeesWithAvailability = employees.filter(e => availableEmployeeIds.has(e.id))

  return { employees: employeesWithAvailability, organization }
}
