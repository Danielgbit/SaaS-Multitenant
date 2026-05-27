import { describe, it, expect } from 'vitest'
import { validateOrigin } from '../csrf'

function makeRequest(origin: string | null, host: string | null): Request {
  const headers = new Headers()
  if (origin) headers.set('origin', origin)
  if (host) headers.set('host', host)
  return new Request('http://localhost', { headers })
}

describe('validateOrigin', () => {
  it('accepts same origin (http)', () => {
    const req = makeRequest('http://localhost:3000', 'localhost:3000')
    expect(validateOrigin(req).valid).toBe(true)
  })

  it('accepts same origin (https)', () => {
    const req = makeRequest('https://app.prugressy.com', 'app.prugressy.com')
    expect(validateOrigin(req).valid).toBe(true)
  })

  it('accepts requests without origin header (browsers, curl)', () => {
    const req = makeRequest(null, 'localhost:3000')
    expect(validateOrigin(req).valid).toBe(true)
  })

  it('rejects cross-origin request', () => {
    const req = makeRequest('https://evil.com', 'app.prugressy.com')
    const result = validateOrigin(req)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('evil.com')
  })

  it('rejects when host header is missing', () => {
    const req = makeRequest('https://app.prugressy.com', null)
    const result = validateOrigin(req)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('host')
  })

  it('rejects invalid origin URL', () => {
    const req = makeRequest('not-a-url', 'localhost:3000')
    const result = validateOrigin(req)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Invalid origin')
  })

  it('accepts subdomain of host', () => {
    const req = makeRequest('https://api.app.prugressy.com', 'app.prugressy.com')
    expect(validateOrigin(req).valid).toBe(true)
  })
})
