export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (/authorization|api.?key|token|secret|bearer|auth|cookie|set-cookie/i.test(key)) {
      out[key] = '***'
    } else {
      out[key] = value
    }
  }
  return out
}

export function truncatePayload(data: unknown, maxBytes = 10_000): unknown {
  if (data === undefined || data === null) return data

  let str: string
  try {
    str = JSON.stringify(data)
  } catch {
    return { truncated: true, reason: 'non-serializable', type: typeof data }
  }

  if (!str || str.length <= maxBytes) return data

  return {
    truncated: true,
    originalSize: str.length,
    originalType: Array.isArray(data) ? 'array' : typeof data,
    preview: str.slice(0, maxBytes) + '...',
  }
}

export function classifyProviderError(
  error: Error,
  status?: number
): 'timeout' | 'network' | 'rate_limit' | 'server_error' | 'invalid_response' | 'unknown' {
  if (error.name === 'AbortError') return 'timeout'
  if (status === 429) return 'rate_limit'
  if (status && status >= 500) return 'server_error'
  if (error.message?.includes('fetch') || error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) return 'network'
  if (status && status >= 400) return 'invalid_response'
  return 'unknown'
}
