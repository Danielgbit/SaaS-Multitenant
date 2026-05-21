/**
 * Shadow Runner
 * Procesa seeds en batch: enriquece V2, compara, persiste logs
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '../logger'
import { shadowNotifyConfig } from './config'
import {
  ShadowSeed,
  V2TemplateSnapshot,
  V2ProviderSnapshot,
  V2ResolvedVariables,
  SHADOW_COMPARISON_VERSION,
  ShadowBatchResult,
  ComparisonResult,
} from './types'
import { compareV1V2, normalizeSnapshot } from './comparator'

async function recoverStuckSeeds(supabase: any, timeoutMinutes: number): Promise<number> {
  const timeoutMs = timeoutMinutes * 60 * 1000
  const cutoffTime = new Date(Date.now() - timeoutMs).toISOString()

  const { data, error } = await supabase
    .from('shadow_notification_seeds')
    .update({
      status: 'pending',
      claimed_at: null,
      attempts: 0,
      last_error: null,
    })
    .eq('status', 'processing')
    .lt('claimed_at', cutoffTime)

  if (error) {
    logger.error('shadow_stuck_recovery_failed', { error: error.message })
    return 0
  }

  const recovered = data?.length || 0
  if (recovered > 0) {
    logger.info('shadow_stuck_seeds_recovered', { count: recovered })
  }

  return recovered
}

async function claimBatch(
  supabase: any,
  batchSize: number,
  workerId: string
): Promise<ShadowSeed[]> {
  const now = new Date().toISOString()

  const { data: pendingSeeds, error: selectError } = await supabase
    .from('shadow_notification_seeds')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (selectError) {
    logger.error('shadow_claim_select_failed', { error: selectError.message })
    return []
  }

  if (!pendingSeeds || pendingSeeds.length === 0) {
    return []
  }

  const seedIds = pendingSeeds.map((s: any) => s.id)

  const { error: updateError } = await supabase
    .from('shadow_notification_seeds')
    .update({
      status: 'processing',
      claimed_at: now,
    })
    .in('id', seedIds)

  if (updateError) {
    logger.error('shadow_claim_update_failed', { error: updateError.message })
    return []
  }

  const claimedSeeds = pendingSeeds.map((seed: any) => ({
    ...seed,
    status: 'processing' as const,
    claimed_at: now,
  }))

  return claimedSeeds
}

async function enrichV2Snapshots(seed: ShadowSeed): Promise<{
  template: V2TemplateSnapshot
  provider: V2ProviderSnapshot
  variables: V2ResolvedVariables
  rendered: string
  scheduledAt: string | null
  error?: string
}> {
  try {
    const supabase = await createClient()
    const v1 = seed.v1_snapshot

    const { data: providerData } = await (supabase as any)
      .from('notification_providers')
      .select('provider, config, channel, rate_limit_per_min, is_enabled')
      .eq('organization_id', v1.organizationId)
      .eq('channel', v1.channel)
      .eq('is_enabled', true)
      .limit(1)
      .single()

    const providerSnapshot: V2ProviderSnapshot = {
      provider: providerData?.provider || null,
      config: (providerData?.config as Record<string, unknown>) || null,
      channel: providerData?.channel || v1.channel,
      rateLimitPerMin: providerData?.rate_limit_per_min || null,
      isEnabled: !!providerData?.is_enabled,
    }

    const { data: templateData } = await (supabase as any)
      .from('message_templates')
      .select('id, body, variables, channel, type')
      .eq('organization_id', v1.organizationId)
      .eq('channel', v1.channel)
      .ilike('type', `%${v1.templateName}%`)
      .limit(1)
      .single()

    const templateSnapshot: V2TemplateSnapshot = {
      templateId: templateData?.id || null,
      body: templateData?.body || null,
      variables: (templateData?.variables as string[]) || null,
      channel: templateData?.channel || null,
      type: templateData?.type || null,
    }

    const variablesSnapshot: V2ResolvedVariables = {
      variables: { ...v1.templateVariables },
      resolvedAt: new Date().toISOString(),
    }

    let rendered = ''
    if (templateSnapshot.body) {
      rendered = templateSnapshot.body
      for (const [key, value] of Object.entries(v1.templateVariables)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      }
    }

    const scheduledAt = v1.sentAt

    return {
      template: templateSnapshot,
      provider: providerSnapshot,
      variables: variablesSnapshot,
      rendered,
      scheduledAt,
    }
  } catch (e) {
    const error = e as Error
    return {
      template: { templateId: null, body: null, variables: null, channel: null, type: null },
      provider: { provider: null, config: null, channel: seed.v1_snapshot.channel, rateLimitPerMin: null, isEnabled: false },
      variables: { variables: {}, resolvedAt: new Date().toISOString() },
      rendered: '',
      scheduledAt: null,
      error: error.message,
    }
  }
}

async function storeComparison(
  supabase: any,
  seed: ShadowSeed,
  result: ComparisonResult,
  v1Normalized: Record<string, unknown>,
  v2Normalized: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('shadow_notification_logs').insert({
    seed_id: seed.id,
    organization_id: seed.organization_id,
    appointment_id: seed.appointment_id,
    v1_normalized: v1Normalized,
    v2_normalized: v2Normalized,
    drift_types: result.drift_types,
    drift_score: result.drift_score,
    severity: result.severity,
    comparison_detail: result.comparison_detail as unknown as Record<string, unknown>,
    comparison_version: SHADOW_COMPARISON_VERSION,
    snapshot_version: seed.snapshot_version,
  })

  if (error) {
    logger.error('shadow_log_insert_failed', {
      seedId: seed.id,
      error: error.message,
    })
    throw error
  }
}

async function ackSeed(
  supabase: any,
  seedId: string,
  status: 'completed' | 'failed',
  error?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    status,
    claimed_at: null,
  }

  if (status === 'failed') {
    update.last_error = error || null
    const { data: existingData } = await supabase
      .from('shadow_notification_seeds')
      .select('attempts')
      .eq('id', seedId)
      .single()
    update.attempts = (existingData?.attempts || 0) + 1
  }

  const { error: updateError } = await supabase
    .from('shadow_notification_seeds')
    .update(update)
    .eq('id', seedId)

  if (updateError) {
    logger.error('shadow_ack_failed', { seedId, error: updateError.message })
  }
}

export async function runShadowBatch(supabase?: any): Promise<ShadowBatchResult> {
  const config = shadowNotifyConfig()
  const client = supabase || await createClient()
  const workerId = `shadow-worker-${crypto.randomUUID()}`

  const result: ShadowBatchResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    driftDetected: 0,
    matchCount: 0,
    averageDriftScore: 0,
  }

  let totalDriftScore = 0

  try {
    const recovered = await recoverStuckSeeds(client, config.processingTimeoutMinutes)
    if (recovered > 0) {
      logger.info('shadow_stuck_recovered', { count: recovered })
    }

    const seeds = await claimBatch(client, config.batchSize, workerId)
    if (seeds.length === 0) {
      logger.debug('shadow_no_seeds_to_process')
      return result
    }

    logger.info('shadow_batch_started', { count: seeds.length, workerId })

    for (const seed of seeds) {
      try {
        const v1 = seed.v1_snapshot

        const v2Snapshots = await enrichV2Snapshots(seed)

        if (v2Snapshots.error) {
          const errorComparison: ComparisonResult = {
            drift_types: ['orchestration_drift'],
            drift_score: 100,
            severity: 'critical',
            comparison_detail: {
              render: {
                v1_hash: v1.renderedMessageHash,
                v2_hash: '',
                semantic_match: false,
                diff_type: 'not_compared',
              },
              template: {
                v1_name: v1.templateName,
                v2_id: null,
                v2_body: null,
                match: false,
              },
              provider: {
                v1_type: v1.channel,
                v2_provider: null,
                v2_channel: v1.channel,
                match: false,
              },
              variables: {
                v1_keys: Object.keys(v1.templateVariables),
                v2_keys: [],
                missing: Object.keys(v1.templateVariables),
                extra: [],
                value_drifts: [],
              },
              scheduling: {
                v1_sent_at: v1.sentAt,
                v2_scheduled_at: null,
                delta_seconds: null,
                within_tolerance: false,
              },
              routing: {
                v1_channel: v1.channel,
                v2_channel: v1.channel,
                v1_provider_type: v1.channel,
                v2_provider_type: null,
                match: false,
              },
            },
          }

          await storeComparison(
            client,
            seed,
            errorComparison,
            normalizeSnapshot(v1 as unknown as Record<string, unknown>),
            {}
          )
          await ackSeed(client, seed.id, 'failed', v2Snapshots.error)
          result.failed++
          result.processed++
          continue
        }

        const comparison = compareV1V2(
          v1,
          v2Snapshots.template,
          v2Snapshots.provider,
          v2Snapshots.variables,
          v2Snapshots.rendered,
          v2Snapshots.scheduledAt
        )

        await storeComparison(
          client,
          seed,
          comparison,
          normalizeSnapshot(v1 as unknown as Record<string, unknown>),
          normalizeSnapshot({
            template: v2Snapshots.template,
            provider: v2Snapshots.provider,
            variables: v2Snapshots.variables,
            rendered: v2Snapshots.rendered,
          } as unknown as Record<string, unknown>)
        )

        await ackSeed(client, seed.id, 'completed')

        result.processed++
        result.completed++
        totalDriftScore += comparison.drift_score

        if (comparison.drift_types.some(d => d !== 'match')) {
          result.driftDetected++
        } else {
          result.matchCount++
        }

        logger.debug('shadow_comparison_complete', {
          seedId: seed.id,
          driftScore: comparison.drift_score,
          severity: comparison.severity,
          driftTypes: comparison.drift_types,
        })
      } catch (e) {
        const error = e as Error
        logger.error('shadow_seed_processing_failed', {
          seedId: seed.id,
          error: error.message,
        })

        await ackSeed(client, seed.id, 'failed', error.message)
        result.processed++
        result.failed++
      }
    }

    result.averageDriftScore = result.processed > 0 ? Math.round(totalDriftScore / result.processed) : 0

    logger.info('shadow_batch_completed', {
      processed: result.processed,
      completed: result.completed,
      failed: result.failed,
      driftDetected: result.driftDetected,
      matchCount: result.matchCount,
      averageDriftScore: result.averageDriftScore,
    })
  } catch (e) {
    const error = e as Error
    logger.error('shadow_batch_exception', { error: error.message })
  }

  return result
}
