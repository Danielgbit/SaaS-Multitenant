import { logger } from '@/lib/notifications/logger'

export interface Span {
  traceId: string
  label: string
  start: number
}

export interface TimedResult<T> {
  result: T
  processingTimeMs: number
  traceId: string
}

export function startSpan(label: string): Span {
  return {
    traceId: crypto.randomUUID(),
    label,
    start: Date.now(),
  }
}

export function endSpan(span: Span): number {
  return Date.now() - span.start
}

export async function withTracing<T>(
  label: string,
  fn: (span: Span) => Promise<T>
): Promise<TimedResult<T>> {
  const span = startSpan(label)
  try {
    const result = await fn(span)
    return {
      result,
      processingTimeMs: endSpan(span),
      traceId: span.traceId,
    }
  } catch (error) {
    const processingTimeMs = endSpan(span)
    logger.error(`withTracing failed: ${label}`, { traceId: span.traceId, label, durationMs: processingTimeMs, error })
    throw error
  }
}

export function formatTraceLog(
  span: Span,
  extra?: Record<string, unknown>
): string {
  const elapsed = endSpan(span)
  return JSON.stringify({
    traceId: span.traceId,
    label: span.label,
    elapsedMs: elapsed,
    ...extra,
  })
}