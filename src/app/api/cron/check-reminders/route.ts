import { NextResponse } from 'next/server'
import { runCheckReminders } from '@/actions/cron/runCheckReminders'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { withRequestContext } from '@/lib/request-context'

export const runtime = 'nodejs'

async function sendHeartbeat(supabase: any, workerName: string, status: string, opts: {
  processedCount?: number
  errorCount?: number
  lastError?: string
} = {}) {
  try {
    await supabase.rpc('upsert_worker_heartbeat', {
      p_worker_name: workerName,
      p_status: status,
      p_processed_count: opts.processedCount || 0,
      p_error_count: opts.errorCount || 0,
      p_success_count: 0,
      p_queue_depth: -1,
      p_dlq_depth: -1,
      p_last_latency_ms: null,
      p_last_error: opts.lastError || null,
      p_metadata: '{}',
    })
  } catch {}
}

export async function POST(request: Request) {
  return withRequestContext(undefined, async () => {
    try {
      const authHeader = request.headers.get('authorization')
      const cronSecret = process.env.CRON_SECRET

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const supabase = await createServiceRoleClient()

      await sendHeartbeat(supabase, 'cron-reminders', 'healthy')

      const result = await runCheckReminders(supabase)

      if (!result.success) {
        await sendHeartbeat(supabase, 'cron-reminders', 'error', { lastError: result.errors?.[0] })
        return NextResponse.json({
          message: 'Check reminders failed',
          ...result,
        }, { status: 500 })
      }

      await sendHeartbeat(supabase, 'cron-reminders', 'healthy', {
        processedCount: result.processed || 0,
      })

      return NextResponse.json({
        message: `Processed: ${result.processed} (reminders: ${result.reminders}, alerts: ${result.alerts}, autoCompleted: ${result.autoCompleted})`,
        ...result,
      })
    } catch (error) {
      console.error('Check reminders cron error:', error)
      const errMsg = error instanceof Error ? error.message : String(error)
      try {
        const supabase = await createServiceRoleClient()
        await sendHeartbeat(supabase, 'cron-reminders', 'error', { lastError: errMsg })
      } catch {}
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
      }, { status: 500 })
    }
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger the check-reminders cron',
    endpoint: '/api/cron/check-reminders',
    schedule: 'Every 3 minutes via cron-job.org',
  })
}
