import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  validateConfirmationToken,
  useConfirmationToken,
  invalidateConfirmationTokens,
} from '@/actions/notifications/confirmations/tokens'
import type { ConfirmationTokenAction } from '@/types/notifications'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, action } = body as { token: string; action: ConfirmationTokenAction }

    if (!token || !action) {
      return NextResponse.json(
        { success: false, error: 'Token y acción son requeridos' },
        { status: 400 }
      )
    }

    if (!['confirm', 'cancel'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Acción inválida. Use: confirm o cancel' },
        { status: 400 }
      )
    }

    const validation = await validateConfirmationToken(token)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      )
    }

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      )
    }

    const tokenData = validation.tokenData!
    const supabase = await createServiceRoleClient()

    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', tokenData.appointmentId)
      .single()

    if (apptError || !appointment) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    const useResult = await useConfirmationToken(token, action)

    if (!useResult.success) {
      return NextResponse.json(
        { success: false, error: useResult.error },
        { status: 400 }
      )
    }

    let confirmationStatus: string | null = null
    let appointmentStatus: string | null = null

    if (action === 'confirm') {
      confirmationStatus = 'confirmed'
      appointmentStatus = appointment.status

      await supabase
        .from('appointments')
        .update({
          confirmation_status: confirmationStatus,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', tokenData.appointmentId)

      await supabase
        .from('confirmation_logs')
        .insert({
          appointment_id: tokenData.appointmentId,
          organization_id: tokenData.organizationId,
          action: 'confirmed',
          performed_by: null,
          performed_by_role: 'system',
          notes: `Cliente confirmó via link de confirmación`,
          metadata: { trace_id: tokenData.token },
        })

      await notifyOrganization(
        supabase,
        tokenData.organizationId,
        'confirm',
        appointment
      )

    } else if (action === 'cancel') {
      confirmationStatus = 'cancelled'
      appointmentStatus = 'cancelled'

      // Shadow Mode: capture seed BEFORE mutation
      const shadowSeed = {
        appointmentId: tokenData.appointmentId,
        observedUpdatedAt: appointment.created_at,
        initialStatus: appointment.status,
        initialConfirmationStatus: appointment.confirmation_status,
        correlationId: crypto.randomUUID(),
      }

      await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          confirmation_status: 'cancelled',
        })
        .eq('id', tokenData.appointmentId)

      // Shadow Mode: fire-and-forget validation
      import('@/lib/shadow').then(({ shadowQueue, runShadowValidation }) => {
        shadowQueue.enqueue(async () => {
          await runShadowValidation(
            {
              command: 'appointment:cancel',
              appointmentId: shadowSeed.appointmentId,
              organizationId: tokenData.organizationId,
              correlationId: shadowSeed.correlationId,
              actorId: 'system',
              actorRole: 'system',
              timestamp: new Date().toISOString(),
              payload: { reason: 'client_cancelled_via_token' },
              sourcePath: 'POST/api/confirmations/respond',
            },
            shadowSeed,
            supabase
          )
        })
      }).catch((e) => {
        console.error('[respond/cancel] shadow import error:', e)
      })

      await supabase
        .from('confirmation_logs')
        .insert({
          appointment_id: tokenData.appointmentId,
          organization_id: tokenData.organizationId,
          action: 'cancelled',
          performed_by: null,
          performed_by_role: 'system',
          notes: `Cliente canceló via link de confirmación`,
          metadata: { trace_id: tokenData.token },
        })

      await invalidateConfirmationTokens(tokenData.appointmentId, 'appointment_cancelled')

      await notifyOrganization(
        supabase,
        tokenData.organizationId,
        'cancel',
        appointment
      )
    }

    return NextResponse.json({
      success: true,
      action,
      appointmentId: tokenData.appointmentId,
      confirmationStatus,
      message: action === 'confirm'
        ? '¡Gracias por confirmar tu asistencia!'
        : 'Tu cita ha sido cancelada',
    })
  } catch (error) {
    console.error('[confirmations/respond] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function notifyOrganization(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  organizationId: string,
  action: 'confirm' | 'cancel',
  appointment: Record<string, unknown>
) {
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'admin', 'staff'])

  if (!members || members.length === 0) return

  const notifications = members.map(m => ({
    organization_id: organizationId,
    user_id: m.user_id,
    type: 'confirmation_sent' as const,
    title: action === 'confirm' ? 'Cita confirmada por cliente' : 'Cita cancelada por cliente',
    message: action === 'confirm'
      ? `El cliente confirmó su cita`
      : `El cliente canceló su cita`,
    metadata: {
      appointment_id: appointment.id,
      action,
      channel: 'confirmation_link',
    },
  }))

  await supabase.from('notifications').insert(notifications as any)
}