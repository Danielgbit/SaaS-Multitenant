import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { NotificationInboundEvent } from '@/types/notifications'
import { getRequestId } from '@/lib/request-context'
import { logNotificationEvent } from './event-timeline'

const CONFIRM_KEYWORDS = ['confirmar', 'confirmo', 'sí', 'si', 'yes']
const CANCEL_KEYWORDS = ['cancelar', 'cancelo', 'no']

interface ProcessResult {
  action: 'confirm' | 'cancel' | 'unknown'
  appointmentId?: string
  organizationId?: string
}

function parseAction(text: string): 'confirm' | 'cancel' | 'unknown' {
  const normalized = text.toLowerCase().trim()
  if (CONFIRM_KEYWORDS.some(k => normalized === k || normalized.startsWith(k + ' '))) {
    return 'confirm'
  }
  if (CANCEL_KEYWORDS.some(k => normalized === k || normalized.startsWith(k + ' '))) {
    return 'cancel'
  }
  return 'unknown'
}

async function findAppointmentByPhone(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  fromPhone: string
): Promise<{ appointmentId: string; organizationId: string; queueItemId: string } | null> {
  const cleanPhone = fromPhone.replace(/\D/g, '')

  // 1. Buscar conversación activa con appointment_id vinculado
  const { data: conversation } = await (supabase as any)
    .from('notification_conversations')
    .select('appointment_id')
    .eq('client_phone', cleanPhone)
    .eq('status', 'active')
    .not('appointment_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (conversation?.appointment_id) {
    const { data: queueItem } = await (supabase as any)
      .from('notification_queue')
      .select('id, organization_id')
      .eq('appointment_id', conversation.appointment_id)
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (queueItem) {
      return {
        appointmentId: conversation.appointment_id,
        organizationId: queueItem.organization_id,
        queueItemId: queueItem.id,
      }
    }
  }

  // 2. Fallback: buscar cliente por teléfono y su última cita activa
  const { data: client } = await (supabase as any)
    .from('clients')
    .select('id')
    .eq('phone', cleanPhone)
    .limit(1)
    .single()

  if (client?.id) {
    const { data: appointment } = await (supabase as any)
      .from('appointments')
      .select('id, organization_id')
      .eq('client_id', client.id)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    if (appointment) {
      const { data: queueItem } = await (supabase as any)
        .from('notification_queue')
        .select('id')
        .eq('appointment_id', appointment.id)
        .eq('channel', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        appointmentId: appointment.id,
        organizationId: appointment.organization_id,
        queueItemId: queueItem?.id || '',
      }
    }
  }

  // 3. Fallback final: último queue_item por teléfono (comportamiento original)
  const { data: queueItem } = await (supabase as any)
    .from('notification_queue')
    .select('appointment_id, organization_id, id')
    .eq('to_address', cleanPhone)
    .eq('channel', 'whatsapp')
    .not('appointment_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (queueItem?.appointment_id) {
    return {
      appointmentId: queueItem.appointment_id,
      organizationId: queueItem.organization_id,
      queueItemId: queueItem.id,
    }
  }

  return null
}

export async function processInboundReply(
  event: NotificationInboundEvent
): Promise<ProcessResult> {
  const supabase = await createServiceRoleClient()
  const text = (event.rawPayload.text || event.rawPayload.body || '') as string
  const action = parseAction(text)

  if (action === 'unknown') {
    return { action: 'unknown' }
  }

  await logNotificationEvent({
    organizationId: event.organizationId,
    eventType: 'REPLY_PARSED',
    metadata: { action, fromPhone: event.fromPhone, textLength: text.length },
    traceId: event.traceId,
  }).catch(() => {})

  const fromPhone = event.fromPhone || ''
  const resolved = await findAppointmentByPhone(supabase, fromPhone)

  if (!resolved) {
    return { action }
  }

  const { appointmentId, organizationId: orgId, queueItemId } = resolved

  if (action === 'confirm') {
    await (supabase as any)
      .from('appointments')
      .update({
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    await logNotificationEvent({
      organizationId: orgId,
      eventType: 'APPOINTMENT_UPDATED',
      metadata: { appointmentId, action: 'confirmed', newStatus: 'confirmed' },
      traceId: event.traceId,
    }).catch(() => {})

    await (supabase as any)
      .from('confirmation_logs')
      .insert({
        appointment_id: appointmentId,
        organization_id: orgId,
        action: 'confirmed',
        performed_by: null,
        performed_by_role: 'system',
        notes: 'Cliente confirmó via WhatsApp (inbound pipeline)',
        metadata: { channel: 'whatsapp_reply', trace_id: event.traceId },
      })

    await logNotificationEvent({
      organizationId: orgId,
      queueItemId,
      eventType: 'CONFIRMED',
      metadata: { channel: 'whatsapp_reply', reply_action: 'confirm' },
      traceId: event.traceId,
    })
  } else {
    await (supabase as any)
      .from('appointments')
      .update({
        status: 'cancelled',
        confirmation_status: 'cancelled',
      })
      .eq('id', appointmentId)

    await logNotificationEvent({
      organizationId: orgId,
      eventType: 'APPOINTMENT_UPDATED',
      metadata: { appointmentId, action: 'cancelled', newStatus: 'cancelled' },
      traceId: event.traceId,
    }).catch(() => {})

    await (supabase as any)
      .from('confirmation_logs')
      .insert({
        appointment_id: appointmentId,
        organization_id: orgId,
        action: 'cancelled',
        performed_by: null,
        performed_by_role: 'system',
        notes: 'Cliente canceló via WhatsApp (inbound pipeline)',
        metadata: { channel: 'whatsapp_reply', trace_id: event.traceId },
      })

    await logNotificationEvent({
      organizationId: orgId,
      queueItemId,
      eventType: 'CANCELLED',
      metadata: { channel: 'whatsapp_reply', reply_action: 'cancel' },
      traceId: event.traceId,
    })
  }

  const { data: members } = await (supabase as any)
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin', 'staff'])

  if (members && members.length > 0) {
    await (supabase as any).from('notifications').insert(
      members.map((m: { user_id: string }) => ({
        organization_id: orgId,
        user_id: m.user_id,
        type: 'confirmation_sent',
        title: action === 'confirm' ? 'Cita confirmada' : 'Cita cancelada',
        message: `El cliente ${action === 'confirm' ? 'confirmó' : 'canceló'} via WhatsApp`,
        metadata: { appointment_id: appointmentId, trace_id: event.traceId || getRequestId() || null },
      }))
    )
  }

  await logNotificationEvent({
    organizationId: orgId,
    eventType: 'REPLIED',
    metadata: { channel: 'whatsapp_reply', action },
    traceId: event.traceId,
  })

  return { action, appointmentId, organizationId: orgId }
}