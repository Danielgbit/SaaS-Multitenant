import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateSlots } from '@/services/slots/generateSlots'
import { Database } from '@db/supabase'
import {
  CreateAppointmentSchema,
  checkCreatePreconditions,
  computeAppointmentTimes,
  verifySlotAvailability,
  insertAppointment,
} from '@/lib/appointments/create-appointment-core'

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
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

    const preconditions = await checkCreatePreconditions(supabase, parsed.data)
    if (!preconditions.success) {
      return NextResponse.json({ error: preconditions.error }, { status: 400 })
    }

    const { startDate, endDate } = computeAppointmentTimes(start_time, preconditions.data.service.duration)

    const slotCheck = await verifySlotAvailability(
      supabase, employee_id, service_id, start_time, organization_id,
      { bypassNotice: true }
    )
    if (!slotCheck.success) {
      return NextResponse.json({ error: slotCheck.error }, { status: 400 })
    }

    const insertResult = await insertAppointment(supabase, {
      organization_id,
      client_id,
      employee_id,
      service_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notes: notes || null,
    })

    if (!insertResult.success) {
      return NextResponse.json({ error: insertResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, appointmentId: insertResult.data.id })
  } catch (err) {
    console.error('Error in appointments API:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

// =============================================================================
// PATCH - Actualizar status
// =============================================================================

import {
  validateUpdateStatusInput,
  checkUpdateStatusPreconditions,
  updateAppointmentStatusInDb,
} from '@/lib/appointments/update-appointment-core'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = validateUpdateStatusInput(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { appointment_id, status } = validated.data
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const preconditions = await checkUpdateStatusPreconditions(supabase, appointment_id, user.id)
    if (!preconditions.success) {
      const statusCode = preconditions.statusCode || 500
      return NextResponse.json({ error: preconditions.error }, { status: statusCode })
    }

    const { error: updateError } = await updateAppointmentStatusInDb(supabase, appointment_id, status)
    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    // Shadow Mode (deprecated — no-op stub)
    if (status === 'cancelled') {
      import('@/lib/shadow').catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in appointments API:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

// =============================================================================
// PUT - Editar cita
// =============================================================================

const UpdateAppointmentSchema = z.object({
  appointment_id: z.string().uuid('ID de cita inválido'),
  employee_id: z.string().uuid('ID de empleado inválido').optional(),
  client_id: z.string().uuid('ID de cliente inválido').optional(),
  service_id: z.string().uuid('ID de servicio inválido').optional(),
  start_time: z.string().min(1, 'Fecha inválida').optional(),
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
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

    const updateData: Database['public']['Tables']['appointments']['Update'] = {}
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
        await supabase.from('appointment_services').delete().eq('appointment_id', appointment_id)
        await supabase.from('appointment_services').insert({ appointment_id, service_id })
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
// DELETE - Eliminar cita
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
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

    await supabase.from('appointment_services').delete().eq('appointment_id', appointment_id)

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
