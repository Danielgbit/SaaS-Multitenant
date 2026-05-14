import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { NotificationInboundEvent } from '@/types/notifications'
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

export async function processInboundReply(
  event: NotificationInboundEvent
): Promise<ProcessResult> {
  const supabase = await createServiceRoleClient()
  const text = (event.rawPayload.text || event.rawPayload.body || '') as string
  const action = parseAction(text)

  if (action === 'unknown') {
    return { action: 'unknown' }
  }

  const fromPhone = event.fromPhone?.replace(/\D/g, '') || ''

  const { data: queueItem } = await (supabase as any)
    .from('notification_queue')
    .select('appointment_id, organization_id, id')
    .eq('to_address', fromPhone)
    .eq('channel', 'whatsapp')
    .not('appointment_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!queueItem || !queueItem[0]?.appointment_id) {
    return { action }
  }

  const appointmentId = queueItem[0].appointment_id
  const orgId = queueItem[0].organization_id

  if (action === 'confirm') {
    await (supabase as any)
      .from('appointments')
      .update({
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

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
      queueItemId: queueItem[0]?.id,
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
      queueItemId: queueItem[0]?.id,
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
        metadata: { appointment_id: appointmentId },
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