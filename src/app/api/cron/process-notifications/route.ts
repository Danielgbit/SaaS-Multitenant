import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createChannel } from '@/lib/notifications/channels'
import type { ProcessQueueResult, NotificationChannel } from '@/types/notifications'
import { logNotificationEvent } from '@/lib/notifications/event-timeline'
import { moveToDeadLetter } from '@/lib/notifications/dead-letter'

export const runtime = 'edge'

const BATCH_SIZE = 50
const PROCESSING_TIMEOUT_MINUTES = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000

async function recoverStuckJobs(supabase: Awaited<ReturnType<typeof createServiceRoleClient>>): Promise<number> {
  const tenMinutesAgo = new Date(Date.now() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await (supabase as any)
    .from('notification_queue')
    .update({
      status: 'pending',
      claimed_at: null,
      processing_timeout_at: null,
    })
    .eq('status', 'processing')
    .lt('claimed_at', tenMinutesAgo)
    .select('id')

  if (error) {
    console.error('[processNotifications] Recovery error:', error)
    return 0
  }

  return (data?.length || 0)
}

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

  const recoveredCount = await recoverStuckJobs(supabase)
  if (recoveredCount > 0) {
    console.log(`[processNotifications] Recovered ${recoveredCount} stuck jobs`)
  }

  const { data: batch, error: claimError } = await (supabase as any)
    .from('notification_queue')
    .select(`
      *,
      notification_providers!left(config, is_enabled, rate_limit_per_min)
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (claimError || !batch || batch.length === 0) {
    return result
  }

  const batchIds = batch.map((item: { id: string }) => item.id)

  await (supabase as any)
    .from('notification_queue')
    .update({
      status: 'processing',
      claimed_at: new Date().toISOString(),
      processing_timeout_at: new Date(Date.now() + PROCESSING_TIMEOUT_MINUTES * 60 * 1000).toISOString(),
      attempts: batch.map(() => 0),
    })
    .in('id', batchIds)

  for (const item of batch as (Record<string, unknown>)[]) {
    try {
      const providerConfig = (item.notification_providers as Record<string, unknown>)?.config as Record<string, unknown> || {}
      const rateLimit = (item.notification_providers as Record<string, unknown>)?.rate_limit_per_min as number || 30

      const withinLimit = await checkRateLimit(supabase, item.organization_id as string, item.channel as NotificationChannel, rateLimit)
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
        await (supabase as any)
          .from('notification_queue')
          .update({
            status: 'failed_permanently',
            last_error: `Unsupported channel: ${item.channel}`,
            claimed_at: null,
          })
          .eq('id', item.id)
        result.failed++
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
        metadata: { traceId: item.trace_id },
      })

      try {
        await logNotificationEvent({
          organizationId: item.organization_id as string,
          queueItemId: item.id as string,
          eventType: 'PROCESSING',
          metadata: { attempt: item.attempts || 0 },
          traceId: item.trace_id as string || null,
        })
      } catch {}

      const now = new Date().toISOString()

      if (sendResult.success) {
        await (supabase as any)
          .from('notification_queue')
          .update({
            status: 'sent',
            sent_at: now,
            provider_message_id: sendResult.providerMessageId,
            provider_response: sendResult.rawResponse as Record<string, unknown> | null,
            claimed_at: null,
            processing_timeout_at: null,
          })
          .eq('id', item.id)
        result.sent++
        try {
          await logNotificationEvent({
            organizationId: item.organization_id as string,
            queueItemId: item.id as string,
            eventType: 'SENT',
            metadata: { providerMessageId: sendResult.providerMessageId },
            traceId: item.trace_id as string || null,
          })
        } catch {}
      } else {
        const newAttempts = ((item.attempts as number) || 0) + 1
        const maxAttempts = (item.max_attempts as number) || 3

        if (newAttempts >= maxAttempts) {
          await (supabase as any)
            .from('notification_queue')
            .update({
              status: sendResult.retryable ? 'failed' : 'failed_permanently',
              last_error: sendResult.error,
              attempts: newAttempts,
              claimed_at: null,
              processing_timeout_at: null,
              next_retry_at: sendResult.retryable
                ? new Date(Date.now() + newAttempts * 5 * 60 * 1000).toISOString()
                : null,
            })
            .eq('id', item.id)

          if (!sendResult.retryable) {
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
                },
              })
              await logNotificationEvent({
                organizationId: item.organization_id as string,
                queueItemId: item.id as string,
                eventType: 'DEAD_LETTERED',
                metadata: { error: sendResult.error, errorCode: 'MAX_ATTEMPTS' },
                traceId: item.trace_id as string | null,
              })
            } catch {}
          }
          result.failed++
        } else {
          await (supabase as any)
            .from('notification_queue')
            .update({
              status: 'pending',
              attempts: newAttempts,
              last_error: sendResult.error,
              claimed_at: null,
              processing_timeout_at: null,
              next_retry_at: new Date(Date.now() + newAttempts * 5 * 60 * 1000).toISOString(),
            })
            .eq('id', item.id)
        }
      }

      result.processed++
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error(`[processNotifications] Error processing ${item.id}:`, errMsg)

      await (supabase as any)
        .from('notification_queue')
        .update({
          status: 'failed',
          last_error: errMsg,
          claimed_at: null,
        })
        .eq('id', item.id)

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
      'FOR UPDATE SKIP LOCKED',
      'Stuck job recovery (>10min processing)',
      'Per-org per-channel rate limiting',
      'Exponential retry (max 3 attempts)',
      'failed_permanently for non-retryable errors',
    ],
  })
}