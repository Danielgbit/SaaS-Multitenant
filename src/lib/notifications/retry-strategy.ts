export interface RetryDecision {
  retryable: boolean
  code: string
  backoffMs: number
}

export function classifyError(error: string, status?: number): RetryDecision {
  if (status === 429) return { retryable: true, code: 'rate_limited', backoffMs: 60_000 }
  if (status && status >= 500) return { retryable: true, code: 'server_error', backoffMs: 300_000 }
  if (error.toLowerCase().includes('timeout')) return { retryable: true, code: 'timeout', backoffMs: 300_000 }
  if (error.toLowerCase().includes('invalid')) return { retryable: false, code: 'invalid_input', backoffMs: 0 }
  if (error.toLowerCase().includes('not found') || error.toLowerCase().includes('no encontrado'))
    return { retryable: false, code: 'provider_missing', backoffMs: 0 }
  if (error.toLowerCase().includes('missing')) return { retryable: false, code: 'config_error', backoffMs: 0 }
  return { retryable: true, code: 'unknown_error', backoffMs: 300_000 }
}

export function calculateBackoff(attempt: number, baseMs: number = 300_000, jitterMs: number = 30_000): number {
  const exponential = baseMs * Math.pow(2, Math.min(attempt - 1, 4))
  const jitter = Math.random() * jitterMs
  return Math.floor(exponential + jitter)
}
