// Shadow Queue Abstraction
// Decouples integration API from transport implementation

interface ShadowQueue {
  enqueue(task: () => Promise<void>): void
}

/**
 * Current implementation: queueMicrotask (fire-and-forget)
 * 
 * Future implementations can swap to:
 * - BullMQ
 * - pg-boss
 * - SQS
 * - Kafka
 * 
 * WITHOUT touching legacy action files
 */
export const shadowQueue: ShadowQueue = {
  enqueue(task) {
    queueMicrotask(async () => {
      try {
        await task()
      } catch (error) {
        // NEVER throw. Log and swallow.
        console.error('[shadow] queue task failed:', error)
      }
    })
  },
}

/**
 * Structured logging for shadow operations
 */
export function logShadow(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  logFn(`[shadow] ${message}`, data ? JSON.stringify(data) : '')
}
