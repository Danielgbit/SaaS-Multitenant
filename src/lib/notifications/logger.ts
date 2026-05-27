import { getRequestId } from '@/lib/request-context'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogMeta {
  traceId?: string
  queueItemId?: string
  organizationId?: string
  appointmentId?: string
  eventType?: string
  durationMs?: number
  provider?: string
  error?: unknown
  [key: string]: unknown
}

function sanitizeMeta(meta: LogMeta): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (key === 'error' && value instanceof Error) {
      sanitized[key] = { name: value.name, message: value.message, stack: value.stack }
    } else if (value === undefined) {
      sanitized[key] = null
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

function log(level: LogLevel, message: string, meta?: LogMeta): void {
  try {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'notifications',
      level,
      message,
      traceId: meta?.traceId ?? getRequestId(),
      ...(meta ? sanitizeMeta(meta) : {}),
    })
    switch (level) {
      case 'error':
        console.error(entry)
        break
      case 'warn':
        console.warn(entry)
        break
      case 'debug':
        console.debug(entry)
        break
      default:
        console.log(entry)
    }
  } catch {
    // Logger never throws
  }
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
}

export function logFailureOnce(
  failureLogged: Record<string, boolean>,
  itemId: string,
  message: string,
  meta?: LogMeta
): void {
  if (failureLogged[itemId]) return
  failureLogged[itemId] = true
  logger.error(message, { ...meta, queueItemId: itemId })
}
