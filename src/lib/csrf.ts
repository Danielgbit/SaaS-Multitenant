export function validateOrigin(request: Request): { valid: boolean; reason?: string } {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (!origin) return { valid: true }
  if (!host) return { valid: false, reason: 'Missing host header' }

  try {
    const originUrl = new URL(origin)
    const isSameOrigin =
      originUrl.host === host ||
      originUrl.host.endsWith(`.${host}`) ||
      host.endsWith(`.${originUrl.host}`)

    if (!isSameOrigin) {
      return { valid: false, reason: `Origin ${origin} does not match host ${host}` }
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: `Invalid origin URL: ${origin}` }
  }
}

export function assertSameOrigin(request: Request): void {
  const result = validateOrigin(request)
  if (!result.valid) {
    throw new Error(`Cross-origin request rejected: ${result.reason}`)
  }
}
