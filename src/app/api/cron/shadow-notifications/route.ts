/**
 * Shadow Notification Worker
 * Procesa seeds de validación V1 vs V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/notifications/logger'
import { runShadowBatch } from '@/lib/notifications/shadow/runner'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { withRequestContext } from '@/lib/request-context'
import { serverEnv } from '@/lib/env/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = serverEnv.CRON_SECRET ?? ''

async function sendHeartbeat(
  supabase: any,
  workerName: string,
  status: string,
  opts: {
    processedCount?: number
    errorCount?: number
    lastError?: string
    durationMs?: number
  } = {}
) {
  try {
    await supabase.rpc('upsert_worker_heartbeat', {
      p_worker_name: workerName,
      p_status: status,
      p_processed_count: opts.processedCount || 0,
      p_error_count: opts.errorCount || 0,
      p_success_count: 0,
      p_queue_depth: -1,
      p_dlq_depth: -1,
      p_last_latency_ms: opts.durationMs ?? null,
      p_last_error: opts.lastError || null,
      p_metadata: '{}',
    })
  } catch {}
}

export async function POST(request: NextRequest) {
  return withRequestContext(undefined, async () => {
    const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: missing Bearer token' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  if (token !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid token' },
      { status: 401 }
    )
  }

  const startedAt = Date.now()

  try {
    const supabase = await createServiceRoleClient()

    await sendHeartbeat(supabase, 'cron-shadow', 'healthy')

    logger.info('shadow_worker_started')

    const result = await runShadowBatch(supabase)

    const durationMs = Date.now() - startedAt

    logger.info('shadow_worker_completed', {
      processed: result.processed,
      completed: result.completed,
      failed: result.failed,
      driftDetected: result.driftDetected,
      matchCount: result.matchCount,
      averageDriftScore: result.averageDriftScore,
    })

    await sendHeartbeat(supabase, 'cron-shadow', 'healthy', {
      processedCount: result.processed,
      durationMs,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (e) {
    const error = e as Error
    const durationMs = Date.now() - startedAt

    logger.error('shadow_worker_exception', { error: error.message })

    try {
      const supabase = await createServiceRoleClient()
      await sendHeartbeat(supabase, 'cron-shadow', 'error', {
        lastError: error.message,
        durationMs,
      })
    } catch {}

    return NextResponse.json(
      { error: 'Shadow worker failed', details: error.message },
      { status: 500 }
    )
    }
  })
}

export async function GET() {
  return NextResponse.json({
    description: 'Shadow Notification Worker',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
    purpose: 'Process V1 vs V2 shadow validation seeds',
    tables: {
      input: 'shadow_notification_seeds',
      output: 'shadow_notification_logs',
    },
  })
}
