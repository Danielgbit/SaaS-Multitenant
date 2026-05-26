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
        metadata: { traceId, attemptNumber: (item.attempts as number) || 0 },
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

        // Heartbeat: provider-specific
        const providerName = channelAdapter.getProviderName()
        const providerWorker = `provider-${item.channel as string}`
        await sendHeartbeat(supabase, providerWorker, 'healthy', {
          processedCount: 1,
          successCount: 1,
          lastLatencyMs: sendResult.durationMs,
          metadata: { provider: providerName },
        })

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
            requestPayload: sendResult.httpRequest as Record<string, unknown> | undefined,
            responsePayload: normalizedResponse.raw as Record<string, unknown> | undefined,
            responseStatus: sendResult.httpStatus,
            responseHeaders: sendResult.responseHeaders as Record<string, unknown> | undefined,
            normalizedPayload: normalizedResponse as unknown as Record<string, unknown>,
            durationMs: sendResult.durationMs,
            attemptNumber: sendResult.attemptNumber,
            correlationId,
          }).catch((err: unknown) => {
            logger.error('logOutboundMessage failed in cron', { error: err, queueItemId: item.id as string })
          })
        } catch {}

      } else {
        const newAttempts = ((item.attempts as number) || 0) + 1
        const maxAttempts = (item.max_attempts as number) || 3
        const { retryable } = classifyError(sendResult.error || '', undefined)

        // Heartbeat: provider-specific failure
        const providerWorkerErr = `provider-${item.channel as string}`
        await sendHeartbeat(supabase, providerWorkerErr, 'warning', {
          processedCount: 1,
          errorCount: 1,
          lastLatencyMs: sendResult.durationMs,
          lastError: sendResult.error?.slice(0, 500),
          metadata: { provider: channelAdapter.getProviderName(), newAttempts },
        })

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
              requestPayload: sendResult.httpRequest as Record<string, unknown> | undefined,
              responsePayload: sendResult.rawResponse as Record<string, unknown> | undefined,
              responseStatus: sendResult.httpStatus,
              responseHeaders: sendResult.responseHeaders as Record<string, unknown> | undefined,
              durationMs: sendResult.durationMs,
              errorMessage: sendResult.error,
              errorType: sendResult.errorType,
              retryCount: newAttempts,
              attemptNumber: newAttempts,
              correlationId,
              providerName: channelAdapter.getProviderName(),
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
              requestPayload: sendResult.httpRequest as Record<string, unknown> | undefined,
              responsePayload: sendResult.rawResponse as Record<string, unknown> | undefined,
              responseStatus: sendResult.httpStatus,
              responseHeaders: sendResult.responseHeaders as Record<string, unknown> | undefined,
              durationMs: sendResult.durationMs,
              errorMessage: sendResult.error,
              errorType: sendResult.errorType,
              retryCount: newAttempts,
              attemptNumber: newAttempts,
              correlationId,
              providerName: channelAdapter.getProviderName(),
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

async function getQueueDepth(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>
): Promise<{ queueDepth: number; dlqDepth: number }> {
  try {
    const [{ count: queueCount }, { count: dlqCount }] = await Promise.all([
      (supabase as any).from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase as any).from('dead_letter_notifications').select('*', { count: 'exact', head: true }),
    ])
    return { queueDepth: queueCount || 0, dlqDepth: dlqCount || 0 }
  } catch {
    return { queueDepth: -1, dlqDepth: -1 }
  }
}

async function sendHeartbeat(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  workerName: string,
  status: string,
  opts: {
    processedCount?: number
    successCount?: number
    errorCount?: number
    queueDepth?: number
    dlqDepth?: number
    lastLatencyMs?: number
    lastError?: string
    metadata?: Record<string, unknown>
  } = {}
) {
  try {
    await (supabase as any).rpc('upsert_worker_heartbeat', {
      p_worker_name: workerName,
      p_status: status,
      p_processed_count: opts.processedCount || 0,
      p_success_count: opts.successCount || 0,
      p_error_count: opts.errorCount || 0,
      p_queue_depth: opts.queueDepth ?? -1,
      p_dlq_depth: opts.dlqDepth ?? -1,
      p_last_latency_ms: opts.lastLatencyMs ?? null,
      p_last_error: opts.lastError || null,
      p_metadata: opts.metadata ? JSON.stringify(opts.metadata) : '{}',
    })
  } catch {}
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    // Heartbeat: cron-dispatch alive
    const depth = await getQueueDepth(supabase)
    await sendHeartbeat(supabase, 'cron-dispatch', 'healthy', {
      queueDepth: depth.queueDepth,
      dlqDepth: depth.dlqDepth,
    })

    const result = await processNotificationBatch(supabase)

    // Evaluate worker alerts after processing
    try {
      await (supabase as any).rpc('evaluate_worker_alerts')
    } catch {}

    const finalStatus = result.errors.length > 0 ? 'warning' : 'healthy'
    await sendHeartbeat(supabase, 'cron-dispatch', finalStatus, {
      processedCount: result.processed,
      successCount: result.sent,
      errorCount: result.failed,
      queueDepth: depth.queueDepth,
      dlqDepth: depth.dlqDepth,
      lastError: result.errors[0],
    })

    return NextResponse.json({
      message: `Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`,
      ...result,
      dryRun: DRY_RUN,
    })
  } catch (error) {
    console.error('[processNotifications] Fatal error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)

    // Heartbeat: cron-dispatch error
    try {
      const supabase = await createServiceRoleClient()
      await sendHeartbeat(supabase, 'cron-dispatch', 'error', {
        lastError: errMsg,
      })
    } catch {}

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
