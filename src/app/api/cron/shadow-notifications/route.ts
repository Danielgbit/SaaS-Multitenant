/**
 * Shadow Notification Worker
 * Procesa seeds de validación V1 vs V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/notifications/logger'
import { runShadowBatch } from '@/lib/notifications/shadow/runner'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET || ''

export async function POST(request: NextRequest) {
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

  try {
    logger.info('shadow_worker_started')

    const supabase = await createServiceRoleClient()
    const result = await runShadowBatch(supabase)

    logger.info('shadow_worker_completed', {
      processed: result.processed,
      completed: result.completed,
      failed: result.failed,
      driftDetected: result.driftDetected,
      matchCount: result.matchCount,
      averageDriftScore: result.averageDriftScore,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (e) {
    const error = e as Error
    logger.error('shadow_worker_exception', { error: error.message })
    return NextResponse.json(
      { error: 'Shadow worker failed', details: error.message },
      { status: 500 }
    )
  }
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
