import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { mapProviderStatusToInternal } from '@/types/notifications'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider_message_id, status, channel, error, timestamp, ...rawPayload } = body

    if (!provider_message_id && !status) {
      return NextResponse.json(
        { error: 'provider_message_id or status required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceRoleClient()

    if (provider_message_id) {
      const { data: queueItem, error: findError } = await supabase
        .from('notification_queue')
        .select('id, organization_id, channel, status, attempts, max_attempts, appointment_id')
        .eq('provider_message_id', provider_message_id)
        .single()

      if (!findError && queueItem) {
        const mapped = mapProviderStatusToInternal('n8n', status)

        const updateData: Record<string, unknown> = {
          status: mapped.status,
          provider_response: rawPayload,
          updated_at: new Date().toISOString(),
        }

        if (mapped.status === 'delivered') {
          updateData.delivered_at = timestamp || new Date().toISOString()
        } else if (mapped.status === 'read') {
          updateData.read_at = timestamp || new Date().toISOString()
        } else if (mapped.status === 'failed' && mapped.retryable) {
          const newAttempts = (queueItem.attempts || 0) + 1
          updateData.attempts = newAttempts
          updateData.last_error = error || null
          updateData.next_retry_at = new Date(Date.now() + newAttempts * 5 * 60 * 1000).toISOString()

          if (newAttempts >= (queueItem.max_attempts || 3)) {
            updateData.status = 'failed_permanently'
          } else {
            updateData.status = 'pending'
          }
        } else if (mapped.status === 'failed_permanently' || !mapped.retryable) {
          updateData.status = 'failed_permanently'
          updateData.last_error = error || 'Unknown error'
        }

        await supabase
          .from('notification_queue')
          .update(updateData)
          .eq('id', queueItem.id)

        return NextResponse.json({ success: true, updated: queueItem.id })
      }
    }

    if (channel && status) {
      const { data: items, error: findError } = await supabase
        .from('notification_queue')
        .select('id, organization_id, status, channel')
        .eq('channel', channel)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!findError && items && items.length > 0) {
        const item = items[0]
        const mapped = mapProviderStatusToInternal('n8n', status)

        const updateData: Record<string, unknown> = {
          status: mapped.status,
          provider_response: rawPayload,
          updated_at: new Date().toISOString(),
        }

        if (mapped.status === 'delivered') {
          updateData.delivered_at = timestamp || new Date().toISOString()
        }

        await supabase
          .from('notification_queue')
          .update(updateData)
          .eq('id', item.id)

        return NextResponse.json({ success: true, updated: item.id })
      }
    }

    if (rawPayload.text || rawPayload.Body) {
      const messageText = (rawPayload.text || rawPayload.Body || '').toLowerCase()

      if (['confirmar', 'confirmo', 'sí', 'si', 'yes'].includes(messageText.trim())) {
        await processClientReply(supabase, rawPayload, 'confirm')
      } else if (['cancelar', 'cancelo', 'no'].includes(messageText.trim())) {
        await processClientReply(supabase, rawPayload, 'cancel')
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('[webhooks/notifications] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processClientReply(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  payload: Record<string, unknown>,
  action: 'confirm' | 'cancel'
) {
  const from = payload.from || payload.phone || payload.From || payload.Phone

  if (!from) return

  const { data: queueItem } = await supabase
    .from('notification_queue')
    .select('appointment_id, organization_id')
    .eq('to_address', from)
    .eq('channel', 'whatsapp')
    .not('appointment_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!queueItem || !queueItem[0]?.appointment_id) return

  const appointmentId = queueItem[0].appointment_id
  const orgId = queueItem[0].organization_id

  if (action === 'confirm') {
    await supabase
      .from('appointments')
      .update({
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    await supabase
      .from('confirmation_logs')
      .insert({
        appointment_id: appointmentId,
        organization_id: orgId,
        action: 'confirmed',
        performed_by: null,
        performed_by_role: 'system',
        notes: 'Cliente confirmó via WhatsApp',
        metadata: { channel: 'whatsapp_reply' },
      })
  } else {
    await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        confirmation_status: 'cancelled',
      })
      .eq('id', appointmentId)

    await supabase
      .from('confirmation_logs')
      .insert({
        appointment_id: appointmentId,
        organization_id: orgId,
        action: 'cancelled',
        performed_by: null,
        performed_by_role: 'system',
        notes: 'Cliente canceló via WhatsApp',
        metadata: { channel: 'whatsapp_reply' },
      })
  }

  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin', 'staff'])

  if (members && members.length > 0) {
    await supabase.from('notifications').insert(
      members.map(m => ({
        organization_id: orgId,
        user_id: m.user_id,
        type: 'confirmation_sent',
        title: action === 'confirm' ? 'Cita confirmada' : 'Cita cancelada',
        message: `El cliente ${action === 'confirm' ? 'confirmó' : 'canceló'} via WhatsApp`,
        metadata: { appointment_id: appointmentId },
      }))
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST webhook payloads to receive delivery status updates',
    endpoint: '/api/webhooks/notifications',
    auth: 'Bearer WEBHOOK_SECRET header required',
    payload_format: {
      provider_message_id: 'string (optional)',
      status: 'string (sent|delivered|read|failed|invalid_number|blocked)',
      channel: 'string (optional)',
      error: 'string (optional)',
      timestamp: 'ISO string (optional)',
      from: 'string (phone number for client replies)',
      text: 'string (message text for keyword detection)',
    },
    keywords: {
      confirm: ['confirmar', 'confirmo', 'sí', 'si', 'yes'],
      cancel: ['cancelar', 'cancelo', 'no'],
    },
  })
}