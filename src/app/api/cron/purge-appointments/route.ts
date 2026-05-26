import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'edge'

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

async function runPurgeForOrganization(
  supabase: any,
  organizationId: string,
  olderThanDays: number
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { data: deleted, error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .lt('end_time', cutoffDate.toISOString())
    .select('id')

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  return { success: true, deletedCount: (deleted || []).length }
}

export async function POST(request: Request) {
  const startedAt = Date.now()

  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    await sendHeartbeat(supabase, 'cron-purge', 'healthy')

    const { data: organizations, error: orgError } = await supabase
      .from('booking_settings')
      .select('organization_id, auto_retention_days, auto_purge_enabled')
      .eq('auto_purge_enabled', true)

    if (orgError) {
      await sendHeartbeat(supabase, 'cron-purge', 'error', {
        lastError: orgError.message,
        durationMs: Date.now() - startedAt,
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch organizations with auto-purge enabled',
      }, { status: 500 })
    }

    const results: Array<{
      organization_id: string
      success: boolean
      deletedCount?: number
      error?: string
    }> = []

    for (const org of organizations || []) {
      const result = await runPurgeForOrganization(
        supabase,
        org.organization_id,
        org.auto_retention_days || 90
      )
      results.push({
        organization_id: org.organization_id,
        ...result,
      })
    }

    const totalDeleted = results.reduce(
      (sum, r) => sum + (r.success ? (r.deletedCount || 0) : 0),
      0
    )

    const durationMs = Date.now() - startedAt

    await sendHeartbeat(supabase, 'cron-purge', 'healthy', {
      processedCount: organizations?.length || 0,
      durationMs,
    })

    return NextResponse.json({
      success: true,
      processed: organizations?.length || 0,
      totalDeleted,
      results,
    })
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const errMsg = error instanceof Error ? error.message : String(error)

    try {
      const supabase = await createServiceRoleClient()
      await sendHeartbeat(supabase, 'cron-purge', 'error', {
        lastError: errMsg,
        durationMs,
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
    message: 'Use POST to trigger the purge-appointments cron',
    endpoint: '/api/cron/purge-appointments',
    schedule: 'Once daily via cron-job.org (recommended: 2-3 AM)',
    note: 'Only organizations with auto_purge_enabled = true will be processed',
  })
}
