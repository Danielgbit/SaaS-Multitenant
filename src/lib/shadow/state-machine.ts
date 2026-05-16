// State Machine - Pure validation logic
// From docs/architecture/06-state-machines.md

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'scheduled'
type ConfirmationStatus = 'scheduled' | 'completed' | 'confirmed' | 'needs_review' | 'cancelled'

interface AppointmentState {
  status: AppointmentStatus
  confirmation_status: ConfirmationStatus
}

// Valid transitions from docs/architecture/06-state-machines.md
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  // INITIAL: pending + scheduled
  '(pending,scheduled)': new Set([
    'appointment.cancelled',
    'service.completed',
    'service.completed_manually',
    'service.overdue',
  ]),

  // Employee marked complete: completed + completed
  '(completed,completed)': new Set([
    'payment.confirmed',
    'appointment.cancelled',
    'auto_completion.triggered',
  ]),

  // Overdue: completed + needs_review
  '(completed,needs_review)': new Set([
    'payment.confirmed',
    'appointment.cancelled',
    'service.completed',
    'service.completed_manually',
    'auto_completion.triggered',
  ]),

  // Payment confirmed: completed + confirmed (TERMINAL)
  '(completed,confirmed)': new Set([]),

  // Cancelled (TERMINAL)
  '(cancelled,cancelled)': new Set([]),

  // No show (TERMINAL)
  '(no_show,cancelled)': new Set([]),
}

function stateKey(status: string, confirmationStatus: string): string {
  return `(${status},${confirmationStatus})`
}

export interface StateMachineResult {
  valid: boolean
  fromState: string
  attemptedEvent: string
  reason?: string
  targetState?: {
    status?: string
    confirmation_status?: string
  }
}

/**
 * Pure function: validates if a transition is allowed
 * No side effects, no DB access
 */
export function validateTransition(
  currentState: AppointmentState,
  eventName: string,
  actorRole?: string
): StateMachineResult {
  const fromKey = stateKey(currentState.status, currentState.confirmation_status)
  const allowedEvents = VALID_TRANSITIONS[fromKey]

  if (!allowedEvents) {
    return {
      valid: false,
      fromState: fromKey,
      attemptedEvent: eventName,
      reason: `No transitions defined from state ${fromKey}`,
    }
  }

  if (!allowedEvents.has(eventName)) {
    return {
      valid: false,
      fromState: fromKey,
      attemptedEvent: eventName,
      reason: `Event ${eventName} not allowed from state ${fromKey}`,
    }
  }

  return {
    valid: true,
    fromState: fromKey,
    attemptedEvent: eventName,
    targetState: computeTargetState(eventName),
  }
}

/**
 * Pure function: computes target state from event name
 */
export function computeTargetState(eventName: string): {
  status?: string
  confirmation_status?: string
} {
  switch (eventName) {
    case 'service.completed':
    case 'service.completed_manually':
    case 'auto_completion.triggered':
      return { status: 'completed', confirmation_status: 'completed' }

    case 'service.overdue':
      return { confirmation_status: 'needs_review' }

    case 'payment.confirmed':
      return { confirmation_status: 'confirmed' }

    case 'appointment.cancelled':
      return { status: 'cancelled', confirmation_status: 'cancelled' }

    default:
      return {}
  }
}

/**
 * Maps shadow commands to domain events
 */
export function commandToEvent(command: string): string {
  const mapping: Record<string, string> = {
    'service:complete': 'service.completed',
    'service:complete_manual': 'service.completed_manually',
    'payment:confirm': 'payment.confirmed',
    'appointment:cancel': 'appointment.cancelled',
    'price:adjust': 'price.adjusted',
    'cron:overdue': 'service.overdue',
    'cron:auto_complete': 'auto_completion.triggered',
    'appointment:create': 'appointment.created',
    'appointment:reschedule': 'appointment.rescheduled',
  }

  return mapping[command] || command
}
