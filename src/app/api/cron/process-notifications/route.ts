import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createChannel } from '@/lib/notifications/channels'
import type { ProcessQueueResult, NotificationChannel } from '@/types/notifications'

export const runtime = 'edge'

const BATCH_SIZE = 50
const PROCESSING_TIMEOUT_MINUTES = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000

async function recoverStuckJobs(supabase: Awaited<ReturnType<typeof createServiceRoleClient>>): Promise<number> {
  const tenMinutesAgo = new Date(Date.now() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const { data: stuckJobs, error } = await supabase
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

  const { count } = await supabase
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

  const { data: batch, error: claimError } = await supabase
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

  const batchIds = batch.map(item => item.id)

  await supabase
    .from('notification_queue')
    .update({
      status: 'processing',
      claimed_at: new Date().toISOString(),
      processing_timeout_at: new Date(Date.now() + PROCESSING_TIMEOUT_MINUTES * 60 * 1000).toISOString(),
      attempts: batch.map(() => 0),
    })
    .in('id', batchIds)

  for (const item of batch) {
    try {
      const providerConfig = item.notification_providers?.config || {}
      const rateLimit = item.notification_providers?.rate_limit_per_min || 30

      const withinLimit = await checkRateLimit(supabase, item.organization_id, item.channel, rateLimit)
      if (!withinLimit) {
        await supabase
          .from('notification_queue')
          .update({ status: 'pending', claimed_at: null })
          .eq('id', item.id)
        result.skipped++
        continue
      }

      const channelAdapter = createChannel(item.channel as NotificationChannel, providerConfig)

      if (!channelAdapter) {
        await supabase
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
        toAddress: item.to_address,
        subject: item.subject || undefined,
        body: item.rendered_body || '',
        appointmentId: item.appointment_id || undefined,
        organizationId: item.organization_id,
        idempotencyKey: item.idempotency_key,
        scheduledAt: item.scheduled_at,
        variables: item.variables || {},
        metadata: { traceId: item.trace_id },
      })

      const now = new Date().toISOString()

      if (sendResult.success) {
        await supabase
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
      } else {
        const newAttempts = (item.attempts || 0) + 1
        const maxAttempts = item.max_attempts || 3

        if (newAttempts >= maxAttempts) {
          await supabase
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
          result.failed++
        } else {
          await supabase
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

      await supabase
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