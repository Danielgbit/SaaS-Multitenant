export type QueueStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'failed_permanently'
  | 'cancelled'

const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['sent', 'failed', 'failed_permanently'],
  failed: ['pending'],
  sent: ['delivered', 'read'],
  delivered: ['read'],
  read: [],
  failed_permanently: [],
  cancelled: [],
}

export function canTransition(from: QueueStatus, to: QueueStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertValidTransition(
  from: QueueStatus,
  to: QueueStatus,
  context?: Record<string, unknown>
): void {
  if (!canTransition(from, to)) {
    const error = new Error(`Invalid state transition: ${from} → ${to}`)
    console.error('[state-machine] Invalid transition', {
      from,
      to,
      validTargets: VALID_TRANSITIONS[from] ?? [],
      ...context,
    })
    throw error
  }
}
