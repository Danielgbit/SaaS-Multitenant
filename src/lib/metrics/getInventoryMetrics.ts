import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'
import { captureError } from '@/lib/error-logger'

export interface OpenDivergence {
  id: string
  inventory_item_id: string
  item_name: string
  current_stock: number
  ledger_stock: number
  delta: number
  suggested_action: string | null
}

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
  open_divergences_list: OpenDivergence[]
}

export async function getInventoryMetrics(
  organizationId: string
): Promise<InventoryMetrics> {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = subDays(now, 7).toISOString()
  const dayAgo = subDays(now, 1).toISOString()

  const results = await Promise.allSettled([
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

    supabase.from('inventory_divergences')
      .select('id, inventory_item_id, current_stock, ledger_stock, delta, suggested_action')
      .eq('organization_id', organizationId)
      .eq('status', 'open')
      .limit(20),

    // SECURITY NOTE: notification_worker_heartbeats no tiene RLS.
    // Es tabla global del sistema, no por organización.
    supabase.from('notification_worker_heartbeats')
      .select('last_seen_at, status')
      .eq('worker_name', 'cron-inventory-reconciliation')
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const totalItemsResult = results[0]
  const totalItems = totalItemsResult.status === 'fulfilled' ? (totalItemsResult.value.count ?? 0) : (captureError('inventory_metrics_total_items_error', totalItemsResult.reason, { organizationId }), 0)

  const movementsTodayResult = results[1]
  const movementsToday = movementsTodayResult.status === 'fulfilled' ? (movementsTodayResult.value.count ?? 0) : (captureError('inventory_metrics_movements_today_error', movementsTodayResult.reason, { organizationId }), 0)

  const movementsWeekResult = results[2]
  const movementsWeek = movementsWeekResult.status === 'fulfilled' ? (movementsWeekResult.value.count ?? 0) : (captureError('inventory_metrics_movements_week_error', movementsWeekResult.reason, { organizationId }), 0)

  const openDivergencesResult = results[3]
  const openDivergences = openDivergencesResult.status === 'fulfilled' ? (openDivergencesResult.value.count ?? 0) : (captureError('inventory_metrics_open_divergences_error', openDivergencesResult.reason, { organizationId }), 0)

  const voidEventsResult = results[4]
  const voidEvents = voidEventsResult.status === 'fulfilled' ? (voidEventsResult.value.count ?? 0) : (captureError('inventory_metrics_void_events_24h_error', voidEventsResult.reason, { organizationId }), 0)

  const openDivsResult = results[5]
  const openDivs = openDivsResult.status === 'fulfilled' ? (openDivsResult.value.data ?? []) : (captureError('inventory_metrics_open_divergences_list_error', openDivsResult.reason, { organizationId }), [])

  const heartbeatResult = results[6]
  const heartbeat = heartbeatResult.status === 'fulfilled' ? heartbeatResult.value.data : (captureError('inventory_metrics_cron_heartbeat_error', heartbeatResult.reason, { organizationId }), null)

  // ── Items without movements ──
  // TODO: migrar a vista inventory_items_without_movements
  // cuando el catálogo supere ~500 items.
  let allItems: { id: string }[] | null = null
  try {
    const { data } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('active', true)
    allItems = data
  } catch (error) {
    captureError('inventory_metrics_all_items_error', error, { organizationId })
  }

  const without = allItems?.length
    ? await countItemsWithoutMovements(supabase as any, organizationId, allItems.map(i => i.id))
    : 0

  const total = totalItems ?? 0
  const coveragePct = total > 0
    ? Math.round(((total - without) / total) * 10000) / 100
    : 0

  // ── Divergencias abiertas ──
  let openDivergencesList: OpenDivergence[] = []
  if (openDivs && openDivs.length > 0) {
    const itemIds = [...new Set(openDivs.map((d: any) => d.inventory_item_id))]
    let items: { id: string; name: string }[] | null = null
    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('id, name')
        .in('id', itemIds)
      items = data
    } catch (error) {
      captureError('inventory_metrics_divergence_items_error', error, { organizationId })
    }

    const nameMap = new Map((items || []).map(i => [i.id, i.name]))

    openDivergencesList = (openDivs as any[])
      .map(d => ({
        id: d.id,
        inventory_item_id: d.inventory_item_id,
        item_name: nameMap.get(d.inventory_item_id) || 'Producto',
        current_stock: d.current_stock,
        ledger_stock: d.ledger_stock,
        delta: d.delta,
        suggested_action: d.suggested_action,
      }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  }

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
    open_divergences_list: openDivergencesList,
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
    try {
      const { data: movements } = await supabase
        .from('inventory_movements')
        .select('inventory_item_id')
        .eq('organization_id', orgId)
        .in('inventory_item_id', batch)
        .limit(batch.length)

      const movedIds = new Set((movements || []).map((m: any) => m.inventory_item_id))
      count += batch.filter(id => !movedIds.has(id)).length
    } catch (error) {
      captureError('inventory_metrics_count_without_movements_error', error, { orgId })
    }
  }
  return count
}
