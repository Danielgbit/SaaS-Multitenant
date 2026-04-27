import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlots } from '@/services/slots/generateSlots'
import { z } from 'zod'

const normalizeToISO = (val: unknown) => {
  if (typeof val !== 'string') return val
  return val.endsWith('Z') || val.includes('+') ? val : val + 'Z'
}

const CreateAppointmentSchema = z.object({
  employee_id: z.string().uuid('ID de empleado inválido'),
  client_id: z.string().uuid('ID de cliente inválido'),
  service_id: z.string().uuid('ID de servicio inválido'),
  start_time: z.preprocess(normalizeToISO, z.string().datetime('Fecha inválida')),
  organization_id: z.string().uuid('ID de organización inválido'),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { employee_id, client_id, service_id, start_time, organization_id, notes } = parsed.data
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (orgError || !orgMember) {
      return NextResponse.json({ error: 'No perteneces a esta organización.' }, { status: 403 })
    }

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, organization_id, active')
      .eq('id', employee_id)
      .eq('organization_id', organization_id)
      .single()

    if (empError || !employee || !employee.active) {
      return NextResponse.json({ error: 'El empleado no existe o no está activo.' }, { status: 400 })
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, organization_id')
      .eq('id', client_id)
      .eq('organization_id', organization_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'El cliente no existe.' }, { status: 400 })
    }

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration, active')
      .eq('id', service_id)
      .eq('organization_id', organization_id)
      .single()

    if (serviceError || !service || !service.active) {
      return NextResponse.json({ error: 'El servicio no existe o no está activo.' }, { status: 400 })
    }

    const startDate = new Date(start_time)
    const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000)

    const dateStr = start_time.split('T')[0]
    const availableSlots = await generateSlots({
      employeeId: employee_id,
      serviceId: service_id,
      date: dateStr,
      organizationId: organization_id,
    })

    const slotAvailable = availableSlots.some(
      (slot) =>
        slot.available &&
        new Date(slot.start_time).getTime() === startDate.getTime()
    )

    if (!slotAvailable) {
      return NextResponse.json(
        { error: 'El horario ya no está disponible. Por favor selecciona otro.' },
        { status: 400 }
      )
    }

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        organization_id,
        client_id,
        employee_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'pending',
        notes: notes || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating appointment:', insertError)
      return NextResponse.json({ error: 'Error al crear la cita.' }, { status: 500 })
    }

    await supabase
      .from('appointment_services')
      .insert({
        appointment_id: appointment.id,
        service_id,
      })

    return NextResponse.json({ success: true, appointmentId: appointment.id })
  } catch (err) {
    console.error('Error in appointments API:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

const UpdateStatusSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = UpdateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { appointment_id, status } = parsed.data
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('organization_id')
      .eq('id', appointment_id)
      .single()

    if (aptError || !appointment) {
      return NextResponse.json({ error: 'Cita no encontrada.' }, { status: 404 })
    }

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', appointment.organization_id)
      .single()

    if (!orgMember || orgMember.role === 'empleado') {
      return NextResponse.json({ error: 'No tienes permisos para cambiar el estado de esta cita.' }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointment_id)

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json({ error: 'Error al actualizar la cita.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in appointments API:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

// =============================================================================
// PUT /api/appointments - Editar cita completa
// =============================================================================

const UpdateAppointmentSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
  employee_id: z.string().uuid('ID de empleado inválido').optional(),
  client_id: z.string().uuid('ID de cliente inválido').optional(),
  service_id: z.string().uuid('ID de servicio inválido').optional(),
  start_time: z.preprocess(normalizeToISO, z.string().datetime('Fecha inválida')).optional(),
  notes: z.string().optional(),
  ignoreAvailability: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = UpdateAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { appointment_id, employee_id, client_id, service_id, start_time, notes, ignoreAvailability } = parsed.data
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { data: currentAppointment, error: aptError } = await supabase
      .from('appointments')
      .select('*, services:appointment_services(*)')
      .eq('id', appointment_id)
      .single()

    if (aptError || !currentAppointment) {
      return NextResponse.json({ error: 'Cita no encontrada.' }, { status: 404 })
    }

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', currentAppointment.organization_id)
      .single()

    if (!orgMember || (orgMember.role !== 'owner' && orgMember.role !== 'staff' && orgMember.role !== 'admin')) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta cita.' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    let warning: string | undefined

    if (employee_id && employee_id !== currentAppointment.employee_id) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, active')
        .eq('id', employee_id)
        .eq('organization_id', currentAppointment.organization_id)
        .single()
      
      if (!employee || !employee.active) {
        return NextResponse.json({ error: 'El empleado no existe o no está activo.' }, { status: 400 })
      }
      updateData.employee_id = employee_id
    }

    if (client_id && client_id !== currentAppointment.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', client_id)
        .eq('organization_id', currentAppointment.organization_id)
        .single()
      
      if (!client) {
        return NextResponse.json({ error: 'El cliente no existe.' }, { status: 400 })
      }
      updateData.client_id = client_id
    }

    if (service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('id, duration, active')
        .eq('id', service_id)
        .eq('organization_id', currentAppointment.organization_id)
        .single()
      
      if (!service || !service.active) {
        return NextResponse.json({ error: 'El servicio no existe o no está activo.' }, { status: 400 })
      }
      
      const aptServices = currentAppointment as any
      const currentServiceId = aptServices.appointment_services?.[0]?.service_id
      if (service_id !== currentServiceId) {
        await supabase
          .from('appointment_services')
          .delete()
          .eq('appointment_id', appointment_id)
        
        await supabase
          .from('appointment_services')
          .insert({ appointment_id, service_id })
      }
      
      if (start_time) {
        const startDate = new Date(start_time)
        const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000)
        updateData.start_time = startDate.toISOString()
        updateData.end_time = endDate.toISOString()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'No hay cambios para guardar' })
    }

    if (start_time && start_time !== currentAppointment.start_time && !ignoreAvailability) {
      const empId = employee_id || currentAppointment.employee_id
      const aptServices = currentAppointment as any
      const srvId = service_id || aptServices.appointment_services?.[0]?.service_id
      
      if (empId && srvId) {
        const dateStr = start_time.split('T')[0]
        const slots = await generateSlots({
          employeeId: empId,
          serviceId: srvId,
          date: dateStr,
          organizationId: currentAppointment.organization_id,
        })

        const startDate = new Date(start_time)
        const slotAvailable = slots.some(
          (slot) => slot.available && new Date(slot.start_time).getTime() === startDate.getTime()
        )

        if (!slotAvailable) {
          return NextResponse.json(
            { error: 'El horario no está disponible.', code: 'SLOT_UNAVAILABLE' },
            { status: 400 }
          )
        }

        const originalStart = new Date(currentAppointment.start_time).getTime()
        if (startDate.getTime() !== originalStart) {
          warning = 'El horario de la cita ha cambiado.'
        }
      }
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointment_id)

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json({ error: 'Error al actualizar la cita.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, warning })
  } catch (err) {
    console.error('Error in appointments API:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

// =============================================================================
// DELETE /api/appointments - Eliminar cita
// =============================================================================

const DeleteAppointmentSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
})

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = DeleteAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { appointment_id } = parsed.data
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('organization_id')
      .eq('id', appointment_id)
      .single()

    if (aptError || !appointment) {
      return NextResponse.json({ error: 'Cita no encontrada.' }, { status: 404 })
    }

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', appointment.organization_id)
      .single()

    if (!orgMember || (orgMember.role !== 'owner' && orgMember.role !== 'staff' && orgMember.role !== 'admin')) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar esta cita.' }, { status: 403 })
    }

    await supabase
      .from('appointment_services')
      .delete()
      .eq('appointment_id', appointment_id)

    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment_id)

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar la cita.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in appointments API:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
