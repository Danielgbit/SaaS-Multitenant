import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env/server'
import { appLog } from '@/lib/app-logger'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { runInventoryReconciliation } from '@/actions/cron/runInventoryReconciliation'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = serverEnv.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  appLog('info', 'cron_reconcile_inventory_started')

  const start = Date.now()
  const result = await runInventoryReconciliation()
  const elapsed = Date.now() - start

  appLog('info', 'cron_reconcile_inventory_finished', {
    totalDiverged: result.total_diverged,
    newDivergences: result.new_divergences,
    resolvedDivergences: result.resolved_divergences,
    errors: result.errors.length,
    elapsedMs: elapsed,
  })

  // Heartbeat
  const supabase = await createServiceRoleClient()
  await supabase.rpc('upsert_worker_heartbeat', {
    p_worker_name: 'cron-inventory-reconciliation',
    p_status: result.errors.length > 0 ? 'warning' : 'healthy',
    p_processed_count: result.total_checked,
    p_error_count: result.errors.length,
  })

  return NextResponse.json({ ...result, elapsed_ms: elapsed })
}
