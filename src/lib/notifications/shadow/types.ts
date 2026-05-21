/**
 * Shadow Notification Types
 * Validación V1 vs V2 para migración segura
 */

export const SHADOW_SNAPSHOT_VERSION = 'notify-shadow-v1-20260523'
export const SHADOW_COMPARISON_VERSION = 'compare-v1-20260523'

export type ShadowNotificationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type DriftType =
  | 'match'
  | 'payload_drift'
  | 'template_drift'
  | 'render_drift'
  | 'routing_drift'
  | 'scheduling_drift'
  | 'orchestration_drift'

export type DriftSeverity = 'none' | 'minor' | 'major' | 'critical'

export interface V1Snapshot {
  appointmentId: string
  organizationId: string
  to: string
  templateName: string
  templateVariables: Record<string, string>
  renderedMessage: string
  renderedMessageHash: string
  status: 'sent' | 'failed'
  responseStatus?: number
  errorMessage?: string
  sentAt: string
  providerUrl: string
  channel: 'whatsapp' | 'email' | 'in_app'
}

export interface V2TemplateSnapshot {
  templateId: string | null
  body: string | null
  variables: string[] | null
  channel: string | null
  type: string | null
}

export interface V2ProviderSnapshot {
  provider: string | null
  config: Record<string, unknown> | null
  channel: string
  rateLimitPerMin: number | null
  isEnabled: boolean
}

export interface V2ResolvedVariables {
  variables: Record<string, string>
  resolvedAt: string
}

export interface ShadowSeed {
  id: string
  organization_id: string
  appointment_id: string
  v1_snapshot: V1Snapshot
  snapshot_version: string
  correlation_id: string
  status: ShadowNotificationStatus
  claimed_at: string | null
  attempts: number
  max_attempts: number
  last_error: string | null
  created_at: string
}

export interface ComparisonDetail {
  render: {
    v1_hash: string
    v2_hash: string
    semantic_match: boolean
    diff_type: 'exact' | 'whitespace_only' | 'casing_only' | 'content_diff' | 'not_compared'
  }
  template: {
    v1_name: string
    v2_id: string | null
    v2_body: string | null
    match: boolean
  }
  provider: {
    v1_type: string
    v2_provider: string | null
    v2_channel: string
    match: boolean
  }
  variables: {
    v1_keys: string[]
    v2_keys: string[]
    missing: string[]
    extra: string[]
    value_drifts: Array<{
      key: string
      v1_value: string
      v2_value: string
    }>
  }
  scheduling: {
    v1_sent_at: string
    v2_scheduled_at: string | null
    delta_seconds: number | null
    within_tolerance: boolean
  }
  routing: {
    v1_channel: string
    v2_channel: string
    v1_provider_type: string
    v2_provider_type: string | null
    match: boolean
  }
}

export interface ShadowNotificationLog {
  id: string
  seed_id: string
  organization_id: string
  appointment_id: string
  v1_normalized: Record<string, unknown>
  v2_normalized: Record<string, unknown>
  drift_types: DriftType[]
  drift_score: number
  severity: DriftSeverity
  comparison_detail: ComparisonDetail
  comparison_version: string
  snapshot_version: string
  created_at: string
}

export interface ComparisonResult {
  drift_types: DriftType[]
  drift_score: number
  severity: DriftSeverity
  comparison_detail: ComparisonDetail
}

export interface ShadowBatchResult {
  processed: number
  completed: number
  failed: number
  driftDetected: number
  matchCount: number
  averageDriftScore: number
}
