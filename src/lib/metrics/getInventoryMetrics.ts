import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

export interface InventoryMetrics {
  total_items: number
  items_without_movements: number
  ledger_coverage_pct: number
  movements_today: number
  movements_week: number
  open_divergences: number
  void_events_24h: number
  last_cron_heartbeat: string | null
  cron_status: string | null
  heartbeat_age_minutes: number | null
}

export async function getInventoryMetrics(
  organizationId: string
): Promise<InventoryMetrics> {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = subDays(now, 7).toISOString()
  const dayAgo = subDays(now, 1).toISOString()

  const [
    { count: totalItems },
    { count: movementsToday },
    { count: movementsWeek },
    { count: openDivergences },
    { count: voidEvents },
    { data: heartbeat },
  ] = await Promise.all([
    supabase.from('inventory_items').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).eq('active', true),

    supabase.from('inventory_movements').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).gte('created_at', todayStart),

    supabase.from('inventory_movements').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).gte('created_at', weekAgo),

    supabase.from('inventory_divergences').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).eq('status', 'open'),

    supabase.from('inventory_movements').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).eq('movement_type', 'void')
      .gte('created_at', dayAgo),

    // SECURITY NOTE: notification_worker_heartbeats no tiene RLS.
    // Es tabla global del sistema, no por organización.
    supabase.from('notification_worker_heartbeats')
      .select('last_seen_at, status')
      .eq('worker_name', 'cron-inventory-reconciliation')
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // ── Items without movements ──
  // TODO: migrar a vista inventory_items_without_movements
  // cuando el catálogo supere ~500 items.
  const { data: allItems } = await supabase
    .from('inventory_items')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('active', true)

  const without = allItems?.length
    ? await countItemsWithoutMovements(supabase as any, organizationId, allItems.map(i => i.id))
    : 0

  const total = totalItems ?? 0
  const coveragePct = total > 0
    ? Math.round(((total - without) / total) * 10000) / 100
    : 0

  const heartbeatAge = heartbeat?.last_seen_at
    ? Math.floor((Date.now() - new Date(heartbeat.last_seen_at).getTime()) / 60000)
    : null

  return {
    total_items: total,
    items_without_movements: without,
    ledger_coverage_pct: coveragePct,
    movements_today: movementsToday ?? 0,
    movements_week: movementsWeek ?? 0,
    open_divergences: openDivergences ?? 0,
    void_events_24h: voidEvents ?? 0,
    last_cron_heartbeat: heartbeat?.last_seen_at ?? null,
    cron_status: heartbeatAge !== null
      ? heartbeatAge < 15 ? 'healthy' : heartbeatAge < 60 ? 'warning' : 'critical'
      : null,
    heartbeat_age_minutes: heartbeatAge,
  }
}

async function countItemsWithoutMovements(
  supabase: any,
  orgId: string,
  itemIds: string[]
): Promise<number> {
  if (itemIds.length === 0) return 0

  let count = 0
  const batchSize = 100
  for (let i = 0; i < itemIds.length; i += batchSize) {
    const batch = itemIds.slice(i, i + batchSize)
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('inventory_item_id')
      .eq('organization_id', orgId)
      .in('inventory_item_id', batch)
      .limit(batch.length)

    const movedIds = new Set((movements || []).map((m: any) => m.inventory_item_id))
    count += batch.filter(id => !movedIds.has(id)).length
  }
  return count
}
