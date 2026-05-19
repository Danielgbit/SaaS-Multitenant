// Orchestrator Simulator - Pure function
// Given a command + state, what would the orchestrator do?

import { validateTransition, computeTargetState, commandToEvent } from './state-machine'
import type { AppointmentSnapshot, LegacyResult, OrchestratorResult } from './types'

/**
 * Pure function: simulates what the orchestrator would have done
 * No side effects, no DB writes
 * 
 * This is the model we're testing against reality
 */
export function simulateOrchestrator(
  command: string,
  snapshot: AppointmentSnapshot,
  payload: Record<string, unknown>
): OrchestratorResult {
  const currentState = {
    status: snapshot.status as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'scheduled',
    confirmation_status: snapshot.confirmation_status as 'scheduled' | 'completed' | 'confirmed' | 'needs_review' | 'cancelled',
  }

  const event = commandToEvent(command)

  // Validate transition
  const validation = validateTransition(currentState, event)

  if (!validation.valid) {
    return {
      valid: false,
      targetState: {},
      expectedEvents: [],
      reason: validation.reason,
    }
  }

  // Compute expected state
  const targetState = computeTargetState(event)

  // Build expected events based on command
  const expectedEvents = buildExpectedEvents(command, targetState)

  return {
    valid: true,
    targetState,
    expectedEvents,
  }
}

/**
 * Builds expected events based on command and target state
 * From docs/architecture/07-orchestrator-architecture.md
 */
function buildExpectedEvents(command: string, targetState: { status?: string; confirmation_status?: string }): string[] {
  const events: string[] = []

  switch (command) {
    case 'service:complete':
    case 'service:complete_manual':
    case 'cron:auto_complete':
      events.push('service.completed', 'notification.requested', 'calendar.refresh_requested')
      break

    case 'payment:confirm':
      events.push(
        'payment.confirmed',
        'payroll.generation_requested',
        'notification.requested',
        'calendar.refresh_requested',
        'appointment.execution_completed'
      )
      break

    case 'appointment:cancel':
      events.push('appointment.cancelled', 'notification.requested', 'calendar.refresh_requested', 'appointment.execution_completed')
      break

    case 'price:adjust':
      events.push('price.adjusted')
      break

    case 'cron:overdue':
      events.push('service.overdue', 'notification.requested')
      break

    case 'appointment:create':
      events.push('appointment.created', 'notification.requested')
      break

    default:
      events.push('unknown.command')
  }

  return events
}

/**
 * Compares legacy result vs orchestrator result
 * Returns drift details if any
 */
export function detectDrift(
  legacyResult: Record<string, unknown>,
  orchestratorResult: OrchestratorResult
): Array<{ field: string; legacy: unknown; orchestrator: unknown }> {
  const drifts: Array<{ field: string; legacy: unknown; orchestrator: unknown }> = []

  // Compare state fields
  const stateFields = ['status', 'confirmation_status']

  for (const field of stateFields) {
    const legacyValue = legacyResult[field]
    const orchestratorValue = field === 'status' 
      ? orchestratorResult.targetState.status 
      : orchestratorResult.targetState.confirmation_status

    if (orchestratorValue !== undefined && legacyValue !== orchestratorValue) {
      drifts.push({
        field,
        legacy: legacyValue,
        orchestrator: orchestratorValue,
      })
    }
  }

  return drifts
}

/**
 * Classifies an operational observation based on detected patterns.
 * Pure function — no side effects, no enforcement.
 */
export function classifyObservation(
  command: string,
  snapshot: AppointmentSnapshot,
  orchestratorResult: OrchestratorResult,
  legacyResult: LegacyResult
): string | undefined {
  // POST_COMPLETION_CANCEL: cancel on already completed appointment
  if (command === 'appointment:cancel' && snapshot.status === 'completed') {
    return 'POST_COMPLETION_CANCEL'
  }

  // LEGACY_SHORTCUT: disallowed transition that legacy system still made
  if (!orchestratorResult.valid) {
    if (command === 'service:complete' && snapshot.status === 'completed' && snapshot.confirmation_status === 'completed') {
      return 'LEGACY_SHORTCUT'
    }
    if (command === 'service:complete' && snapshot.status === 'completed' && snapshot.confirmation_status === 'needs_review') {
      return 'LEGACY_SHORTCUT'
    }
  }

  // SEMANTIC_DRIFT: legacy uses different spelling/state than orchestrator expects
  if (legacyResult.status === 'canceled' && orchestratorResult.targetState?.status === 'cancelled') {
    return 'SEMANTIC_DRIFT'
  }

  // HUMAN_OVERRIDE: manual action that bypasses standard flow
  if (command === 'service:complete_manual') {
    return 'HUMAN_OVERRIDE'
  }

  return undefined
}
