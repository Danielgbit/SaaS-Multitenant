/**
 * Shadow Comparator
 * Comparación tolerante V1 vs V2 con score 0-100
 */

import {
  V1Snapshot,
  V2TemplateSnapshot,
  V2ProviderSnapshot,
  V2ResolvedVariables,
  ComparisonResult,
  ComparisonDetail,
  DriftType,
  DriftSeverity,
} from './types'
import { shadowNotifyConfig } from './config'

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `sha256:${Math.abs(hash).toString(16)}`
}

function normalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string') {
      normalized[key] = value.trim().replace(/\s+/g, ' ')
    } else {
      normalized[key] = value
    }
  }
  return normalized
}

function normalizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ').toLowerCase()
}

function compareRender(v1: V1Snapshot, v2Rendered: string): ComparisonDetail['render'] {
  const v1Hash = v1.renderedMessageHash
  const v2Hash = hashString(v2Rendered)

  if (v1Hash === v2Hash) {
    return {
      v1_hash: v1Hash,
      v2_hash: v2Hash,
      semantic_match: true,
      diff_type: 'exact',
    }
  }

  const v1Normalized = normalizeString(v1.renderedMessage)
  const v2Normalized = normalizeString(v2Rendered)

  if (v1Normalized === v2Normalized) {
    return {
      v1_hash: v1Hash,
      v2_hash: v2Hash,
      semantic_match: true,
      diff_type: 'whitespace_only',
    }
  }

  if (v1Normalized.toLowerCase() === v2Normalized.toLowerCase()) {
    return {
      v1_hash: v1Hash,
      v2_hash: v2Hash,
      semantic_match: true,
      diff_type: 'casing_only',
    }
  }

  return {
    v1_hash: v1Hash,
    v2_hash: v2Hash,
    semantic_match: false,
    diff_type: 'content_diff',
  }
}

function compareVariables(
  v1Vars: Record<string, string>,
  v2Vars: Record<string, string>
): ComparisonDetail['variables'] {
  const v1Keys = Object.keys(v1Vars).sort()
  const v2Keys = Object.keys(v2Vars).sort()

  const missing = v1Keys.filter(k => !v2Keys.includes(k))
  const extra = v2Keys.filter(k => !v1Keys.includes(k))
  const commonKeys = v1Keys.filter(k => v2Keys.includes(k))

  const valueDrifts: Array<{ key: string; v1_value: string; v2_value: string }> = []
  for (const key of commonKeys) {
    if (v1Vars[key] !== v2Vars[key]) {
      valueDrifts.push({
        key,
        v1_value: v1Vars[key],
        v2_value: v2Vars[key],
      })
    }
  }

  return {
    v1_keys: v1Keys,
    v2_keys: v2Keys,
    missing,
    extra,
    value_drifts: valueDrifts,
  }
}

function compareScheduling(
  v1SentAt: string,
  v2ScheduledAt: string | null,
  toleranceSeconds: number
): ComparisonDetail['scheduling'] {
  if (!v2ScheduledAt) {
    return {
      v1_sent_at: v1SentAt,
      v2_scheduled_at: null,
      delta_seconds: null,
      within_tolerance: false,
    }
  }

  const v1Time = new Date(v1SentAt).getTime()
  const v2Time = new Date(v2ScheduledAt).getTime()
  const deltaSeconds = Math.abs(v2Time - v1Time) / 1000

  return {
    v1_sent_at: v1SentAt,
    v2_scheduled_at: v2ScheduledAt,
    delta_seconds: Math.round(deltaSeconds),
    within_tolerance: deltaSeconds <= toleranceSeconds,
  }
}

function calculateDriftScore(
  driftTypes: DriftType[],
  comparisonDetail: ComparisonDetail
): number {
  if (driftTypes.length === 0 || driftTypes.every(d => d === 'match')) {
    return 0
  }

  let score = 0

  if (driftTypes.includes('render_drift')) {
    const renderDetail = comparisonDetail.render
    if (renderDetail.diff_type === 'content_diff') {
      score += 40
    } else if (renderDetail.diff_type === 'casing_only') {
      score += 10
    } else if (renderDetail.diff_type === 'whitespace_only') {
      score += 5
    }
  }

  if (driftTypes.includes('template_drift')) {
    score += 30
  }

  if (driftTypes.includes('routing_drift') || driftTypes.includes('orchestration_drift')) {
    score += 50
  }

  if (driftTypes.includes('payload_drift')) {
    const varDetail = comparisonDetail.variables
    score += varDetail.missing.length * 10
    score += varDetail.extra.length * 5
    score += varDetail.value_drifts.length * 5
  }

  if (driftTypes.includes('scheduling_drift')) {
    const schedDetail = comparisonDetail.scheduling
    if (schedDetail.delta_seconds && schedDetail.delta_seconds > 300) {
      score += 30
    } else if (schedDetail.delta_seconds && schedDetail.delta_seconds > 60) {
      score += 15
    }
  }

  return Math.min(100, score)
}

function determineSeverity(driftScore: number, driftTypes: DriftType[]): DriftSeverity {
  if (driftScore === 0 || driftTypes.every(d => d === 'match')) {
    return 'none'
  }

  if (driftTypes.includes('orchestration_drift') || driftTypes.includes('routing_drift')) {
    return 'critical'
  }

  if (driftScore >= 70) {
    return 'critical'
  }

  if (driftScore >= 40) {
    return 'major'
  }

  if (driftScore >= 15) {
    return 'minor'
  }

  return 'none'
}

export function compareV1V2(
  v1: V1Snapshot,
  v2Template: V2TemplateSnapshot,
  v2Provider: V2ProviderSnapshot,
  v2Variables: V2ResolvedVariables,
  v2Rendered: string,
  v2ScheduledAt: string | null
): ComparisonResult {
  const config = shadowNotifyConfig()
  const driftTypes: DriftType[] = []

  const renderComparison = compareRender(v1, v2Rendered)
  const variablesComparison = compareVariables(v1.templateVariables, v2Variables.variables)
  const schedulingComparison = compareScheduling(v1.sentAt, v2ScheduledAt, config.schedulingToleranceSeconds)

  const templateMatch =
    v2Template.body !== null &&
    normalizeString(v2Template.body).includes(normalizeString(v1.templateName))

  const providerMatch =
    v2Provider.provider !== null &&
    v2Provider.channel === v1.channel

  const routingMatch =
    v2Provider.channel === v1.channel &&
    providerMatch

  if (!renderComparison.semantic_match) {
    driftTypes.push('render_drift')
  }

  if (!templateMatch && v2Template.templateId !== null) {
    driftTypes.push('template_drift')
  }

  if (variablesComparison.missing.length > 0 || variablesComparison.extra.length > 0 || variablesComparison.value_drifts.length > 0) {
    driftTypes.push('payload_drift')
  }

  if (!routingMatch) {
    driftTypes.push('routing_drift')
  }

  if (!schedulingComparison.within_tolerance) {
    driftTypes.push('scheduling_drift')
  }

  if (v1.status === 'sent' && v2Rendered === '') {
    driftTypes.push('orchestration_drift')
  }

  if (driftTypes.length === 0) {
    driftTypes.push('match')
  }

  const comparisonDetail: ComparisonDetail = {
    render: renderComparison,
    template: {
      v1_name: v1.templateName,
      v2_id: v2Template.templateId,
      v2_body: v2Template.body,
      match: templateMatch,
    },
    provider: {
      v1_type: v1.channel,
      v2_provider: v2Provider.provider,
      v2_channel: v2Provider.channel,
      match: providerMatch,
    },
    variables: variablesComparison,
    scheduling: schedulingComparison,
    routing: {
      v1_channel: v1.channel,
      v2_channel: v2Provider.channel,
      v1_provider_type: v1.channel,
      v2_provider_type: v2Provider.provider,
      match: routingMatch,
    },
  }

  const driftScore = calculateDriftScore(driftTypes, comparisonDetail)
  const severity = determineSeverity(driftScore, driftTypes)

  return {
    drift_types: driftTypes,
    drift_score: driftScore,
    severity,
    comparison_detail: comparisonDetail,
  }
}

export function normalizeSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return normalizeObject(snapshot)
}
