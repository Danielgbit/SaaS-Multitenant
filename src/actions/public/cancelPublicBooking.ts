'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =============================================================================
// SCHEMA DE VALIDACIÓN
// =============================================================================

const CancelPublicBookingSchema = z.object({
  organizationSlug: z.string().min(1, 'Slug de organización requerido'),
  appointmentId: z.string().uuid().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().min(8).optional(),
  cancellationReason: z.string().optional(),
})

type CancelPublicBookingInput = z.infer<typeof CancelPublicBookingSchema>

// =============================================================================
// TIPOS DE RESULTADO
// =============================================================================

export type CancelBookingErrorType =
  | 'invalid_input'
  | 'not_found'
  | 'appointment_not_found'
  | 'already_cancelled'
  | 'already_completed'
  | 'too_late'
  | 'unauthorized'
  | 'organization_not_found'
  | 'unknown'

export interface CancelPublicBookingResult {
  success?: boolean
  error?: string
  errorType?: CancelBookingErrorType
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MIN_CANCELLATION_HOURS = 2 // No cancelar si quedan menos de 2 horas

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
// HELPER: Validar identidad del cliente
// =============================================================================

function validateClientIdentity(
  appointmentClientEmail: string | null,
  appointmentClientPhone: string,
  inputEmail?: string,
  inputPhone?: string
): boolean {
  // Si el cliente de la cita tiene email, verificarlo
  if (appointmentClientEmail && inputEmail) {
    return appointmentClientEmail.toLowerCase() === inputEmail.toLowerCase()
  }

  // Siempre verificar por teléfono (más confiable)
  if (inputPhone) {
    // Normalizar teléfonos (solo números)
    const normalizePhone = (p: string) => p.replace(/\D/g, '')
    return normalizePhone(appointmentClientPhone) === normalizePhone(inputPhone)
  }

  return false
}

// =============================================================================
// HELPER: Verificar si puede cancelarse por tiempo
// =============================================================================

function canCancelByTime(startTime: Date): boolean {
  const now = new Date()
  const hoursUntilAppointment =
    (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  return hoursUntilAppointment >= MIN_CANCELLATION_HOURS
}

// =============================================================================
// SERVER ACTION
// =============================================================================

/**
 * Cancela una reserva pública sin necesidad de autenticación.
 * El cliente debe verificar su identidad por email o teléfono.
 *
 * @param input - Datos de cancelación
 * @returns Resultado con éxito o error
 */
export async function cancelPublicBooking(
  input: CancelPublicBookingInput
): Promise<CancelPublicBookingResult> {
  // 1. Validar input
  const parsed = CancelPublicBookingSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Datos inválidos',
      errorType: 'invalid_input',
    }
  }

  const { organizationSlug, appointmentId, clientEmail, clientPhone, cancellationReason } =
    parsed.data

  // 2. Verificar que al menos tenemos forma de identificar al cliente
  if (!appointmentId && !clientPhone && !clientEmail) {
    return {
      error: 'Se requiere identificación (email o teléfono) o ID de cita',
      errorType: 'invalid_input',
    }
  }

  const supabase = await createClient()

  // 3. Obtener organización
  const organization = await getOrganizationBySlug(organizationSlug)

  if (!organization) {
    return {
      error: 'Organización no encontrada',
      errorType: 'organization_not_found',
    }
  }

  // 4. Buscar la cita
  let appointment: any = null

  if (appointmentId) {
    // Búsqueda directa por ID
    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
        id,
        status,
        confirmation_status,
        start_time,
        client_id,
        organization_id,
        created_at,
        clients!inner(email, phone)
      `
      )
      .eq('id', appointmentId)
      .eq('organization_id', organization.id)
      .single()

    if (!error && data) {
      appointment = data
    }
  } else {
    // Búsqueda por cliente (última cita pending de las últimas 24h)
    let query = supabase
      .from('appointments')
      .select(
        `
        id,
        status,
        confirmation_status,
        start_time,
        client_id,
        organization_id,
        created_at,
        clients!inner(email, phone)
      `
      )
      .eq('organization_id', organization.id)
      .eq('status', 'pending')
      .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (clientEmail) {
      query = query.eq('clients.email', clientEmail)
    } else if (clientPhone) {
      query = query.eq('clients.phone', clientPhone)
    } else {
      return {
        error: 'Se requiere email o teléfono para identificar la reserva',
        errorType: 'invalid_input',
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single()

    if (!error && data) {
      appointment = data
    }
  }

  // 5. Verificar que se encontró la cita
  if (!appointment) {
    return {
      error: 'No se encontró la reserva',
      errorType: 'appointment_not_found',
    }
  }

  // 6. Verificar que ya no está cancelada
  if (appointment.status === 'cancelled') {
    return {
      error: 'Esta reserva ya fue cancelada',
      errorType: 'already_cancelled',
    }
  }

  // 7. Verificar que no está completada
  if (appointment.status === 'completed') {
    return {
      error: 'No se puede cancelar una reserva ya completada',
      errorType: 'already_completed',
    }
  }

  // 8. Verificar identidad del cliente (si no usamos appointmentId directo)
  if (!appointmentId) {
    const clientData = appointment.clients
    const isIdentityValid = validateClientIdentity(
      clientData?.email || null,
      clientData?.phone || '',
      clientEmail,
      clientPhone
    )

    if (!isIdentityValid) {
      return {
        error: 'No pudimos verificar tu identidad. Revisa el email y teléfono.',
        errorType: 'unauthorized',
      }
    }
  }

  // 9. Verificar tiempo mínimo
  const startTime = new Date(appointment.start_time)
  if (!canCancelByTime(startTime)) {
    return {
      error: `No se puede cancelar con menos de ${MIN_CANCELLATION_HOURS} horas de anticipación`,
      errorType: 'too_late',
    }
  }

    // 10. Cancelar la cita
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancellationReason || null,
    })
    .eq('id', appointment.id)

  if (updateError) {
    console.error('Error cancelling appointment:', updateError)
    return {
      error: 'No se pudo cancelar la reserva. Intenta de nuevo.',
      errorType: 'unknown',
    }
  }

  // Shadow Mode: fire-and-forget validation
  const shadowSeed = {
    appointmentId: appointment.id,
    observedUpdatedAt: appointment.created_at,
    initialStatus: appointment.status,
    initialConfirmationStatus: appointment.confirmation_status || 'scheduled',
    correlationId: crypto.randomUUID(),
  }

  import('@/lib/shadow').catch(() => {})

  // 11. Encolar notificación de cancelación
  try {
    const clientData = appointment.clients

    // WhatsApp
    const { data: whatsappSettings } = await (supabase as any)
      .from('whatsapp_settings')
      .select('enabled')
      .eq('organization_id', organization.id)
      .single()

    if (whatsappSettings?.enabled && clientData?.phone) {
      const { queueWhatsAppMessage } = await import('@/actions/whatsapp/whatsApp')
      await queueWhatsAppMessage({
        organizationId: organization.id,
        appointmentId: appointment.id,
        phone: clientData.phone,
        template: 'appointment_cancelled' as any,
        variables: {
          date: startTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          time: startTime.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      })
    }

    // Email
    if (clientData?.email) {
      const { data: emailSettings } = await (supabase as any)
        .from('email_settings')
        .select('enabled, send_cancellation')
        .eq('organization_id', organization.id)
        .single()

      if (emailSettings?.enabled && emailSettings?.send_cancellation) {
        const { queueEmailMessage } = await import('@/actions/email/queueEmailMessage')
        await queueEmailMessage({
          organizationId: organization.id,
          appointmentId: appointment.id,
          emailType: 'appointment_cancelled' as any,
          to: clientData.email,
          variables: {
            businessName: organization.name,
            clientName: clientData.name,
            serviceName: 'Servicio',
            employeeName: 'Profesional',
            date: startTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
            time: startTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duration: '60',
          } as any,
        })
      }
    }
  } catch (notificationError) {
    console.error('Error sending cancellation notifications:', notificationError)
  }

  // 12. Revalidar
  revalidatePath('/calendar')

  return { success: true }
}

// =============================================================================
// HELPER: Obtener información de cancelación (para el link en email)
// =============================================================================

export async function getCancellationInfo(
  organizationSlug: string,
  appointmentId: string
): Promise<{
  canCancel: boolean
  reason?: string
  appointment?: {
    id: string
    date: string
    time: string
    serviceName?: string
    employeeName?: string
  }
}> {
  const organization = await getOrganizationBySlug(organizationSlug)

  if (!organization) {
    return { canCancel: false, reason: 'Organización no encontrada' }
  }

  const supabase = await createClient()

  const { data: appointment, error } = await (supabase as any)
    .from('appointments')
    .select(
      `
      id,
      start_time,
      status,
      appointment_services(
        services(name)
      ),
      employee:employees(name)
    `
    )
    .eq('id', appointmentId)
    .eq('organization_id', organization.id)
    .single()

  if (error || !appointment) {
    return { canCancel: false, reason: 'Reserva no encontrada' }
  }

  const startTime = new Date(appointment.start_time)
  const canCancel =
    appointment.status === 'pending' && canCancelByTime(startTime)

  return {
    canCancel,
    reason: !canCancel
      ? appointment.status === 'cancelled'
        ? 'Esta reserva ya fue cancelada'
        : appointment.status === 'completed'
        ? 'Esta reserva ya fue completada'
        : `No se puede cancelar con menos de ${MIN_CANCELLATION_HOURS} horas de anticipación`
      : undefined,
    appointment: {
      id: appointment.id,
      date: startTime.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      time: startTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      serviceName: appointment.appointment_services?.[0]?.services?.name,
      employeeName: appointment.employee?.name,
    },
  }
}