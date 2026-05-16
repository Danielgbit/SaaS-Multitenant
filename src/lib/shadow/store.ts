// Shadow Store - Persistence layer
import { createClient } from '@/lib/supabase/server'
import type { ShadowValidationInput, LegacyResult, OrchestratorResult, AppointmentSnapshot } from './types'
import { shadowConfig } from './config'
import type { SupabaseClient } from '@supabase/supabase-js'

interface StoreInput {
  input: ShadowValidationInput
  legacyResult: LegacyResult
  orchestratorResult: OrchestratorResult
  snapshot: AppointmentSnapshot
  snapshotChanged: boolean
  driftDetail?: Array<{ field: string; legacy: unknown; orchestrator: unknown }>
  error?: string
}

/**
 * Persists shadow validation result to database
 */
export async function storeValidation(data: StoreInput): Promise<void> {
  const supabase = await createClient()

  // drift_detected = true ONLY for state-invalidating drift
  const driftDetected = data.driftDetail !== undefined && data.driftDetail.length > 0

  const record = {
    organization_id: data.input.organizationId,
    appointment_id: data.input.appointmentId,
    command: data.input.command,
    correlation_id: data.input.correlationId,
    legacy_result: data.legacyResult,
    orchestrator_result: data.orchestratorResult,
    drift_detected: driftDetected,
    drift_detail: data.driftDetail ? JSON.stringify(data.driftDetail) : null,
    snapshot_changed: data.snapshotChanged,
    state_before: null, // Not captured in 2A minimal
    state_after: JSON.stringify(data.snapshot),
    shadow_mode: shadowConfig.mode,
    validation_version: shadowConfig.validationVersion,
    captured_at: data.input.timestamp,
    actor_id: data.input.actorId,
    actor_role: data.input.actorRole,
  }

  const { error } = await (supabase as any)
    .from('shadow_validation_logs')
    .insert(record)

  if (error) {
    console.error('[shadow] storeValidation error:', error)
    throw error
  }
}

/**
 * Stores error when shadow validation fails internally
 */
export async function storeError(
  input: ShadowValidationInput,
  error: unknown
): Promise<void> {
  const supabase = await createClient()

  const record = {
    organization_id: input.organizationId,
    appointment_id: input.appointmentId,
    command: input.command,
    correlation_id: input.correlationId,
    legacy_result: { success: false, error: String(error) },
    orchestrator_result: { valid: false, targetState: {}, expectedEvents: [], reason: 'Shadow validation failed' },
    drift_detected: false,
    drift_detail: null,
    state_before: null,
    state_after: '{}',
    shadow_mode: shadowConfig.mode,
    validation_version: shadowConfig.validationVersion,
    captured_at: input.timestamp,
    actor_id: input.actorId,
    actor_role: input.actorRole,
  }

  await (supabase as any)
    .from('shadow_validation_logs')
    .insert(record)
}
