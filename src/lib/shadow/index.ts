// Shadow Mode Phase 2A - Entry Point
// Minimal drift detection: Legacy result vs Orchestrator decision

import { shadowQueue, logShadow } from './queue'
import { shadowConfig, isFlowEnabled } from './config'
import { captureSnapshot, buildLegacyResult } from './capturer'
import { simulateOrchestrator, detectDrift, classifyObservation } from './orchestrator'
import { storeValidation, storeError } from './store'
import type { ShadowValidationInput, ShadowSeed } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Main entry point for shadow validation
 * 
 * Flow:
 * 1. Capture snapshot (state after legacy mutation)
 * 2. Simulate orchestrator (what would it have done?)
 * 3. Compare results
 * 4. Detect drift
 * 5. Persist to shadow_validation_logs
 * 
 * NEVER throws, NEVER blocks, NEVER affects production
 */
export async function runShadowValidation(
  input: ShadowValidationInput,
  seed: ShadowSeed,
  supabase?: SupabaseClient
): Promise<void> {
  const startTime = Date.now()

  // Check if flow is enabled
  if (!isFlowEnabled(input.command)) {
    logShadow('info', 'validation skipped - flow disabled', {
      command: input.command,
      correlationId: input.correlationId,
    })
    return
  }

  logShadow('info', 'validation started', {
    command: input.command,
    correlationId: input.correlationId,
    appointmentId: input.appointmentId,
  })

  try {
    // 1. Capture snapshot
    const { snapshot, snapshotChanged, error: captureError } = await captureSnapshot(seed, supabase)

    if (captureError || !snapshot) {
      logShadow('error', 'snapshot capture failed', {
        command: input.command,
        correlationId: input.correlationId,
        error: captureError,
      })
      await storeError(input, captureError || 'Snapshot capture failed', supabase)
      return
    }

    logShadow('info', 'snapshot captured', {
      appointmentId: input.appointmentId,
      snapshotChanged,
      status: snapshot.status,
      confirmation_status: snapshot.confirmation_status,
    })

    // 2. Build legacy result
    const legacyResult = buildLegacyResult(snapshot)

    // 3. Simulate orchestrator
    const orchestratorResult = simulateOrchestrator(
      input.command,
      snapshot,
      input.payload
    )

    logShadow('info', 'orchestrator simulated', {
      valid: orchestratorResult.valid,
      targetState: orchestratorResult.targetState,
      expectedEvents: orchestratorResult.expectedEvents,
    })

    // 4. Detect drift (state comparison only, not snapshot metadata)
    const driftDetail = detectDrift(legacyResult, orchestratorResult)

    if (driftDetail.length > 0) {
      logShadow('warn', 'drift detected', {
        appointmentId: input.appointmentId,
        driftDetail,
      })
    }

    if (snapshotChanged) {
      logShadow('info', 'snapshot changed while queued', {
        appointmentId: input.appointmentId,
        snapshotChanged,
      })
    }

    // 5. Classify observation (operational telemetry, no enforcement)
    const classification = classifyObservation(
      input.command,
      snapshot,
      orchestratorResult,
      legacyResult
    )

    if (classification) {
      input.classification = classification
      logShadow('info', 'observation classified', {
        appointmentId: input.appointmentId,
        classification,
      })
    }

    // 6. Persist
    await storeValidation({
      input,
      legacyResult,
      orchestratorResult,
      snapshot,
      snapshotChanged,
      driftDetail: driftDetail.length > 0 ? driftDetail : undefined,
    }, supabase)

    const duration = Date.now() - startTime
    logShadow('info', 'validation completed', {
      command: input.command,
      correlationId: input.correlationId,
      driftDetected: driftDetail.length > 0,
      snapshotChanged,
      durationMs: duration,
    })
  } catch (error) {
    // NEVER throw. Log and store error.
    logShadow('error', 'validation failed', {
      command: input.command,
      correlationId: input.correlationId,
      error,
    })

    try {
      await storeError(input, error, supabase)
    } catch (storeErr) {
      console.error('[shadow] failed to store error:', storeErr)
    }
  }
}

/**
 * Shadow queue export for legacy action integration
 */
export { shadowQueue } from './queue'

/**
 * Type exports
 */
export type { ShadowValidationInput, ShadowSeed } from './types'
