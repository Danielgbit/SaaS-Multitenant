import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logger } from '@/lib/notifications/logger'
import { mapProviderStatusToInternal } from '@/types/notifications'
import { recordInboundEvent, markEventProcessed } from '@/lib/notifications/inbound-events'
import { processInboundReply } from '@/lib/notifications/processor'
import { logNotificationEvent } from '@/lib/notifications/event-timeline'
import { startSpan, endSpan } from '@/lib/notifications/observability'
import { WasenderProvider } from '@/lib/notifications/channels/whatsapp/providers/wasender'
import { N8NProvider } from '@/lib/notifications/channels/whatsapp/providers/n8n'
import type { WhatsAppProvider } from '@/lib/notifications/channels/whatsapp/providers/types'
import type { NotificationProviderType } from '@/types/notifications'

export const runtime = 'edge'

function detectProvider(
  payload: Record<string, unknown>
): { provider: WhatsAppProvider; providerType: NotificationProviderType } {
  if (payload.key || payload.message || payload.conversation) {
    return { provider: new WasenderProvider({}), providerType: 'wasender' }
  }
  return { provider: new N8NProvider({}), providerType: 'n8n' }
}

export async function POST(request: Request) {
  const span = startSpan('webhook:notifications')
  const rawBody = await request.text()
  const supabase = await createServiceRoleClient()

  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    await logNotificationEvent({
      eventType: 'WEBHOOK_RECEIVED',
      metadata: { payloadSize: rawBody.length },
      traceId: span.traceId,
    }).catch(() => {})

    const { provider: detectedProvider, providerType } = detectProvider(body)
    const provider = detectedProvider
    const isValid = await provider.validateWebhook(request, rawBody)

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await logNotificationEvent({
      eventType: 'WEBHOOK_VALIDATED',
      metadata: { providerType, payloadSize: rawBody.length },
      traceId: span.traceId,
    }).catch(() => {})

    const parsed = provider.parseWebhook(body)

    if (parsed.providerMessageId) {
      const { data: queueItem } = await (supabase as any)
        .from('notification_queue')
        .select('id, organization_id, channel, status, attempts, max_attempts, appointment_id, trace_id')
        .eq('provider_message_id', parsed.providerMessageId)
        .single()

      if (queueItem) {
        if (parsed.status) {
          const mapped = mapProviderStatusToInternal(providerType, parsed.status)
          const updateData: Record<string, unknown> = {
            status: mapped.status,
            provider_response: parsed.rawPayload,
            updated_at: new Date().toISOString(),
          }

          if (mapped.status === 'delivered') {
            updateData.delivered_at = parsed.timestamp
          } else if (mapped.status === 'read') {
            updateData.read_at = parsed.timestamp
          } else if (mapped.status === 'failed' && mapped.retryable) {
            const newAttempts = ((queueItem as Record<string, unknown>).attempts as number || 0) + 1
            updateData.attempts = newAttempts
            updateData.last_error = parsed.rawPayload?.error as string || null
            updateData.next_retry_at = new Date(Date.now() + newAttempts * 5 * 60 * 1000).toISOString()
            if (newAttempts >= ((queueItem as Record<string, unknown>).max_attempts as number || 3)) {
              updateData.status = 'failed_permanently'
            } else {
              updateData.status = 'pending'
            }
          } else if (mapped.status === 'failed_permanently' || !mapped.retryable) {
            updateData.status = 'failed_permanently'
            updateData.last_error = parsed.rawPayload?.error as string || 'Unknown error'
          }

          await (supabase as any)
            .from('notification_queue')
            .update(updateData)
            .eq('id', (queueItem as Record<string, unknown>).id)

          if (['delivered', 'read', 'failed_permanently'].includes(mapped.status)) {
            const eventType = mapped.status === 'delivered' ? 'DELIVERED'
              : mapped.status === 'read' ? 'READ'
              : 'FAILED'
            await logNotificationEvent({
              organizationId: (queueItem as Record<string, unknown>).organization_id as string,
              queueItemId: (queueItem as Record<string, unknown>).id as string,
              eventType,
              metadata: { providerStatus: parsed.status },
              traceId: (queueItem as Record<string, unknown>).trace_id as string || span.traceId,
            })
          }

          return NextResponse.json({
            success: true,
            updated: (queueItem as Record<string, unknown>).id,
            traceId: span.traceId,
          })
        }

        if (parsed.text && parsed.fromPhone) {
          const recordResult = await recordInboundEvent({
            providerMessageId: parsed.providerMessageId,
            channel: 'whatsapp',
            provider: providerType,
            fromPhone: parsed.fromPhone,
            rawPayload: parsed.rawPayload,
            traceId: span.traceId,
          })

          if (!recordResult.created) {
            return NextResponse.json({
              success: true,
              message: 'Event already processed',
              traceId: span.traceId,
            })
          }

          const processingStart = Date.now()
          try {
            await processInboundReply(recordResult.event)
          } finally {
            const processingTimeMs = Date.now() - processingStart
            await markEventProcessed(recordResult.event.id, {
              processingTimeMs,
            })
          }
        }
      }
    }

    if (parsed.text && parsed.fromPhone && !parsed.providerMessageId) {
      const { data: queueItem } = await (supabase as any)
        .from('notification_queue')
        .select('appointment_id, organization_id, id, trace_id')
        .eq('to_address', parsed.fromPhone.replace(/\D/g, ''))
        .eq('channel', 'whatsapp')
        .not('appointment_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      const recordResult = await recordInboundEvent({
        providerMessageId: `no_msg_id_${crypto.randomUUID()}`,
        channel: 'whatsapp',
        provider: providerType,
        fromPhone: parsed.fromPhone,
        rawPayload: parsed.rawPayload,
        traceId: span.traceId,
      })

      if (recordResult.created) {
        const processingStart = Date.now()
        try {
          await processInboundReply(recordResult.event)
        } finally {
          await markEventProcessed(recordResult.event.id, {
            processingTimeMs: Date.now() - processingStart,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      processingTimeMs: endSpan(span),
      traceId: span.traceId,
    })
  } catch (error) {
    logger.error('Webhook fatal', { traceId: span.traceId, error })
    return NextResponse.json(
      { success: false, error: 'Internal server error', traceId: span.traceId },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST webhook payloads to receive delivery status updates',
    endpoint: '/api/webhooks/notifications',
    auth: 'Provider-specific auth (validateWebhook per provider)',
    payload_format: {
      wasender: { key: 'object', message: 'object', status: 'string', from: 'string' },
      n8n: { provider_message_id: 'string', status: 'string', from: 'string', text: 'string' },
    },
    keywords: {
      confirm: ['confirmar', 'confirmo', 'sí', 'si', 'yes'],
      cancel: ['cancelar', 'cancelo', 'no'],
    },
  })
}