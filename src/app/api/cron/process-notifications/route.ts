import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createChannel } from '@/lib/notifications/channels'
import { logger, logFailureOnce } from '@/lib/notifications/logger'
import type { ProcessQueueResult, NotificationChannel, NotificationProviderType, ProviderSnapshot } from '@/types/notifications'
import { logNotificationEvent } from '@/lib/notifications/event-timeline'
import { moveToDeadLetter } from '@/lib/notifications/dead-letter'
import { assertValidTransition, type QueueStatus } from '@/lib/notifications/state-machine'
import { classifyError, calculateBackoff } from '@/lib/notifications/retry-strategy'
import { logOutboundMessage, logOutboundAttempt } from '@/lib/notifications/messages'
import { normalizeSendResponse } from '@/lib/notifications/normalization'

export const runtime = 'nodejs'
export const maxDuration = 60

const DRY_RUN = process.env.PROCESS_NOTIFICATIONS_DRY_RUN === 'true'
const BATCH_SIZE = 50
const RATE_LIMIT_WINDOW_MS = 60 * 1000

async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  organizationId: string,
  channel: NotificationChannel,
  providerRateLimit: number
): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { count } = await (supabase as any)
    .from('notification_queue')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('channel', channel)
    .eq('status', 'sent')
    .gte('sent_at', oneMinuteAgo)

  return (count || 0) < providerRateLimit
}

async function resolveProviderConfig(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  item: Record<string, unknown>
): Promise<{ config: Record<string, unknown>; rateLimit: number } | null> {
  const snapshot = (item.provider_snapshot ?? null) as ProviderSnapshot | null

  if (snapshot?.providerId) {
    const { data: provider } = await (supabase as any)
      .from('notification_providers')
      .select('config, rate_limit_per_min')
      .eq('id', snapshot.providerId)
      .eq('is_enabled', true)
      .single()

    if (provider) {
      return {
        config: (provider.config as Record<string, unknown>) || {},
        rateLimit: (provider.rate_limit_per_min as number) || 30,
      }
    }

    return null
  }

  // Fallback legacy: items sin snapshot
  const { data: provider } = await (supabase as any)
    .from('notification_providers')
    .select('config, rate_limit_per_min')
    .eq('organization_id', item.organization_id)
    .eq('channel', item.channel)
    .eq('is_enabled', true)
    .limit(1)
    .single()

  if (provider) {
    return {
      config: (provider.config as Record<string, unknown>) || {},
      rateLimit: (provider.rate_limit_per_min as number) || 30,
    }
  }

  return null
}

async function processNotificationBatch(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>
): Promise<ProcessQueueResult> {
  const result: ProcessQueueResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  const workerId = crypto.randomUUID()

  const { data: batch, error: claimError } = await (supabase as any)
    .rpc('claim_notification_batch', {
      batch_size: BATCH_SIZE,
      worker_id: workerId,
      worker_ver: 'v2',
    })

  if (claimError || !batch || batch.length === 0) {
    if (claimError) {
      logger.error('RPC claim failed', { error: claimError })
    }
    return result
  }

  for (const item of batch as Record<string, unknown>[]) {
    const failureLogged: Record<string, boolean> = {}
    const traceId = item.trace_id ? String(item.trace_id) : undefined

    const processingStartedAt = new Date().toISOString()

    try {
      await (supabase as any)
        .from('notification_queue')
        .update({ processing_started_at: processingStartedAt })
        .eq('id', item.id)

      await logNotificationEvent({
        organizationId: item.organization_id as string,
        queueItemId: item.id as string,
        eventType: 'PROCESSING',
        metadata: { attempt: item.attempts || 0 },
        traceId,
      }).catch(() => {})

      const resolved = await resolveProviderConfig(supabase, item)
      if (!resolved) {
        assertValidTransition('processing' as QueueStatus, 'failed_permanently', { itemId: item.id })
        await (supabase as any)
          .from('notification_queue')
          .update({
            status: 'failed_permanently',
            last_error: `No provider config found for queue item ${item.id}`,
            claimed_at: null,
          })
          .eq('id', item.id)
        logFailureOnce(failureLogged, item.id as string, 'Provider config not found', { traceId, queueItemId: item.id as string, organizationId: item.organization_id as string })
        await logNotificationEvent({
          organizationId: item.organization_id as string,
          queueItemId: item.id as string,
          eventType: 'FAILED',
          metadata: { reason: 'no_provider_config' },
          traceId,
        }).catch(() => {})
        result.failed++
        continue
      }

      const { config: providerConfig, rateLimit } = resolved

      const withinLimit = await checkRateLimit(
        supabase,
        item.organization_id as string,
        item.channel as NotificationChannel,
        rateLimit,
      )
      if (!withinLimit) {
        await (supabase as any)
          .from('notification_queue')
          .update({ status: 'pending', claimed_at: null })
          .eq('id', item.id)
        result.skipped++
        continue
      }

      const channelAdapter = createChannel(item.channel as NotificationChannel, providerConfig)
      if (!channelAdapter) {
        assertValidTransition('processing' as QueueStatus, 'failed_permanently', { itemId: item.id })
        await (supabase as any)
          .from('notification_queue')
          .update({
            status: 'failed_permanently',
            last_error: `Unsupported channel: ${item.channel}`,
            claimed_at: null,
          })
          .eq('id', item.id)
        logFailureOnce(failureLogged, item.id as string, 'Unsupported channel', { traceId, queueItemId: item.id as string, channel: item.channel as string })
        await logNotificationEvent({
          organizationId: item.organization_id as string,
          queueItemId: item.id as string,
          eventType: 'FAILED',
          metadata: { reason: 'unsupported_channel', channel: item.channel },
          traceId,
        }).catch(() => {})
        result.failed++
        continue
      }

      if (DRY_RUN) {
        logger.info('dry_run_send', {
          queueItemId: item.id as string,
          channel: item.channel as string,
          toAddress: item.to_address as string,
          organizationId: item.organization_id as string,
          appointmentId: item.appointment_id as string,
          provider: channelAdapter.getProviderName(),
          traceId,
        })

        await (supabase as any)
          .from('notification_queue')
          .update({
            status: 'pending',
            claimed_at: null,
            processing_timeout_at: null,
          })
          .eq('id', item.id)

        result.skipped++
        continue
      }

      const sendResult = await channelAdapter.send({
        channel: item.channel as NotificationChannel,
        toAddress: item.to_address as string,
        subject: item.subject as string | undefined,
        body: (item.rendered_body as string) || '',
        appointmentId: item.appointment_id as string | undefined,
        organizationId: item.organization_id as string,
        idempotencyKey: item.idempotency_key as string,
        scheduledAt: item.scheduled_at as string,
        variables: (item.variables as Record<string, string>) || {},
        metadata: { traceId },
      })

      const now = new Date().toISOString()

      if (sendResult.success) {
        assertValidTransition('processing' as QueueStatus, 'sent', { itemId: item.id })
        await (supabase as any)
          .from('notification_queue')
          .update({
            status: 'sent',
            sent_at: now,
            completed_at: now,
            provider_message_id: sendResult.providerMessageId,
            provider_response: sendResult.rawResponse as Record<string, unknown> | null,
            claimed_at: null,
            processing_timeout_at: null,
          })
          .eq('id', item.id)
        result.sent++

        try {
          const created = new Date(item.created_at as string).getTime()
          const sent = new Date(now).getTime()
          const latencyMs = sent - created
          logger.info('queue_latency', {
            queueItemId: item.id as string,
            organizationId: item.organization_id as string,
            channel: item.channel as string,
            latencyMs,
            latencySeconds: Math.round(latencyMs / 1000),
          })

          const providerType = channelAdapter.getProviderName()
          const sentPayload = {
            channel: item.channel as NotificationChannel,
            to_address: item.to_address as string,
            body: (item.rendered_body as string) || '',
            variables: (item.variables as Record<string, string>) || {},
            appointment_id: item.appointment_id as string,
            trace_id: traceId,
          }
          const normalizedResponse = normalizeSendResponse(providerType, sendResult.rawResponse)
          const correlationId = (item.correlation_id as string) || `notif_${(traceId || crypto.randomUUID()).slice(0, 8)}_${Date.now()}`

          await logNotificationEvent({
            organizationId: item.organization_id as string,
            queueItemId: item.id as string,
            eventType: 'SENT',
            metadata: { providerMessageId: sendResult.providerMessageId },
            traceId: traceId || undefined,
            latencyMs,
            providerMessageId: sendResult.providerMessageId,
            correlationId,
            workerId: workerId,
          })

          await logOutboundMessage({
            organizationId: item.organization_id as string,
            queueItemId: item.id as string,
            providerMessageId: sendResult.providerMessageId,
            direction: 'outbound',
            channel: item.channel as string,
            payload: { to_address: item.to_address, body: item.rendered_body, variables: item.variables },
            status: 'sent',
            traceId,
            requestPayload: sentPayload,
            responsePayload: normalizedResponse.raw as Record<string, unknown> | undefined,
            responseStatus: normalizedResponse.statusCode,
            normalizedPayload: normalizedResponse as unknown as Record<string, unknown>,
            correlationId,
          }).catch((err: unknown) => {
            logger.error('logOutboundMessage failed in cron', { error: err, queueItemId: item.id as string })
          })
        } catch {}

      } else {
        const newAttempts = ((item.attempts as number) || 0) + 1
        const maxAttempts = (item.max_attempts as number) || 3
        const { retryable } = classifyError(sendResult.error || '', undefined)

        if (newAttempts >= maxAttempts || !retryable) {
          const targetStatus = retryable ? 'failed' : 'failed_permanently' as QueueStatus
          assertValidTransition('processing' as QueueStatus, targetStatus, { itemId: item.id })

          await (supabase as any)
            .from('notification_queue')
            .update({
              status: targetStatus,
              last_error: sendResult.error,
              attempts: newAttempts,
              claimed_at: null,
              processing_timeout_at: null,
            })
            .eq('id', item.id)

          const correlationId = (item.correlation_id as string) || `notif_${(traceId || crypto.randomUUID()).slice(0, 8)}_${Date.now()}`

          await logNotificationEvent({
            organizationId: item.organization_id as string,
            queueItemId: item.id as string,
            eventType: 'FAILED',
            metadata: { error: sendResult.error, attempt: newAttempts, maxAttempts },
            traceId,
            workerId,
            correlationId,
            providerMessageId: sendResult.providerMessageId,
          }).catch(() => {})

          try {
            await logOutboundMessage({
              organizationId: item.organization_id as string,
              queueItemId: item.id as string,
              providerMessageId: sendResult.providerMessageId,
              direction: 'outbound',
              channel: item.channel as string,
              payload: { to_address: item.to_address, body: item.rendered_body, variables: item.variables },
              status: retryable ? 'failed' : 'failed_permanently',
              traceId,
              responsePayload: sendResult.rawResponse as Record<string, unknown> | undefined,
              responseStatus: sendResult.rawResponse ? (sendResult.rawResponse as Record<string, unknown>).status as number : undefined,
              errorMessage: sendResult.error,
              retryCount: newAttempts,
              correlationId,
            }).catch(() => {})
          } catch {}

          if (!retryable) {
            try {
              await moveToDeadLetter({
                queueItem: {
                  id: item.id as string,
                  organization_id: item.organization_id as string,
                  channel: item.channel as NotificationChannel,
                  to_address: item.to_address as string | undefined,
                  rendered_body: item.rendered_body as string | undefined,
                  subject: item.subject as string | undefined,
                  variables: (item.variables as Record<string, string>) || {},
                  last_error: sendResult.error,
                  attempts: newAttempts,
                  trace_id: item.trace_id as string | undefined,
                  correlation_id: correlationId,
                },
              })
              await logNotificationEvent({
                organizationId: item.organization_id as string,
                queueItemId: item.id as string,
                eventType: 'DEAD_LETTERED',
                metadata: { error: sendResult.error, errorCode: 'MAX_ATTEMPTS' },
                traceId,
                workerId,
                correlationId,
              }).catch(() => {})
            } catch {}
          }
          result.failed++
        } else {
          assertValidTransition('processing' as QueueStatus, 'pending', { itemId: item.id })
          const backoffMs = calculateBackoff(newAttempts)
          await (supabase as any)
            .from('notification_queue')
            .update({
              status: 'pending',
              attempts: newAttempts,
              last_error: sendResult.error,
              claimed_at: null,
              processing_timeout_at: null,
              next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
            })
            .eq('id', item.id)

          const correlationId = (item.correlation_id as string) || `notif_${(traceId || crypto.randomUUID()).slice(0, 8)}_${Date.now()}`

          await logNotificationEvent({
            organizationId: item.organization_id as string,
            queueItemId: item.id as string,
            eventType: 'FAILED',
            metadata: { error: sendResult.error, attempt: newAttempts, retryable: true, nextRetryMs: backoffMs },
            traceId,
            workerId,
            correlationId,
            providerMessageId: sendResult.providerMessageId,
          }).catch(() => {})

          try {
            await logOutboundMessage({
              organizationId: item.organization_id as string,
              queueItemId: item.id as string,
              providerMessageId: sendResult.providerMessageId,
              direction: 'outbound',
              channel: item.channel as string,
              payload: { to_address: item.to_address, body: item.rendered_body, variables: item.variables },
              status: 'failed',
              traceId,
              responsePayload: sendResult.rawResponse as Record<string, unknown> | undefined,
              errorMessage: sendResult.error,
              retryCount: newAttempts,
              correlationId,
            }).catch(() => {})
          } catch {}
        }
      }

      result.processed++
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      logger.error('Item processing failed', { queueItemId: item.id as string, traceId, error: errMsg })

      await (supabase as any)
        .from('notification_queue')
        .update({
          status: 'failed',
          last_error: errMsg,
          claimed_at: null,
        })
        .eq('id', item.id)

      logFailureOnce(failureLogged, item.id as string, 'Item processing failed', { traceId, queueItemId: item.id as string, error: errMsg })
      await logNotificationEvent({
        organizationId: item.organization_id as string,
        queueItemId: item.id as string,
        eventType: 'FAILED',
        metadata: { error: errMsg, reason: 'unexpected_error' },
        traceId,
      }).catch(() => {})

      result.errors.push(`Item ${item.id}: ${errMsg}`)
      result.failed++
    }
  }

  return result
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()
    const result = await processNotificationBatch(supabase)

    return NextResponse.json({
      message: `Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`,
      ...result,
      dryRun: DRY_RUN,
    })
  } catch (error) {
    console.error('[processNotifications] Fatal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to process notification queue',
    endpoint: '/api/cron/process-notifications',
    schedule: 'Every 5 minutes via Pipedream',
    features: [
      'RPC atomic claim (FOR UPDATE SKIP LOCKED)',
      'Stuck job recovery (processing_timeout_at)',
      'Provider snapshot resolution',
      'Per-org per-channel rate limiting',
      'Exponential backoff with jitter',
      'State machine validation',
      'Dead letter for permanent failures',
      DRY_RUN ? '⚠️ DRY RUN MODE (no messages sent)' : 'Production mode',
    ],
  })
}
