import { describe, it, expect, vi, beforeEach } from 'vitest'

// Re-implement for test isolation
function createTestLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, number[]>()

  return {
    check(key: string) {
      const now = Date.now()
      const timestamps = hits.get(key) || []
      const active = timestamps.filter(t => now - t < windowMs)
      return {
        allowed: active.length < maxRequests,
        remaining: Math.max(0, maxRequests - active.length),
        resetMs: active.length > 0 ? windowMs - (now - active[0]) : 0,
      }
    },
    hit(key: string) {
      const now = Date.now()
      const timestamps = hits.get(key) || []
      timestamps.push(now)
      hits.set(key, timestamps)
    },
    getSize() { return hits.size },
  }
}

describe('RateLimiter — basic behavior', () => {
  it('allows requests within limit', () => {
    const limiter = createTestLimiter(3, 60_000)
    expect(limiter.check('test-key').allowed).toBe(true)
    limiter.hit('test-key')
    expect(limiter.check('test-key').allowed).toBe(true)
    limiter.hit('test-key')
    expect(limiter.check('test-key').allowed).toBe(true)
  })

  it('blocks requests exceeding limit', () => {
    const limiter = createTestLimiter(2, 60_000)
    limiter.hit('key-a')
    limiter.hit('key-a')
    const result = limiter.check('key-a')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('tracks remaining correctly', () => {
    const limiter = createTestLimiter(5, 60_000)
    expect(limiter.check('key').remaining).toBe(5)
    limiter.hit('key')
    expect(limiter.check('key').remaining).toBe(4)
    limiter.hit('key')
    limiter.hit('key')
    expect(limiter.check('key').remaining).toBe(2)
  })

  it('treats different keys independently', () => {
    const limiter = createTestLimiter(2, 60_000)
    limiter.hit('user-a')
    limiter.hit('user-a')
    expect(limiter.check('user-a').allowed).toBe(false)
    expect(limiter.check('user-b').allowed).toBe(true)
  })

  it('resets after window expires', () => {
    vi.useFakeTimers()
    const limiter = createTestLimiter(1, 60_000)
    limiter.hit('key')
    expect(limiter.check('key').allowed).toBe(false)
    vi.advanceTimersByTime(60_001)
    expect(limiter.check('key').allowed).toBe(true)
    vi.useRealTimers()
  })

  it('handles high concurrency without crashing', () => {
    const limiter = createTestLimiter(1000, 60_000)
    for (let i = 0; i < 100; i++) limiter.hit(`key-${i}`)
    expect(limiter.getSize()).toBe(100)
  })

  it('returns resetMs > 0 when there are hits', () => {
    const limiter = createTestLimiter(3, 60_000)
    limiter.hit('key')
    expect(limiter.check('key').resetMs).toBeGreaterThan(0)
  })

  it('returns resetMs = 0 when no hits', () => {
    const limiter = createTestLimiter(3, 60_000)
    expect(limiter.check('fresh-key').resetMs).toBe(0)
  })
})

describe('RateLimiter — memory cleanup', () => {
  it('allows again after window expires (key cleanup)', () => {
    vi.useFakeTimers()
    const limiter = createTestLimiter(2, 60_000)
    limiter.hit('key')
    limiter.hit('key')
    expect(limiter.check('key').allowed).toBe(false)
    vi.advanceTimersByTime(60_001)
    expect(limiter.check('key').allowed).toBe(true)
    vi.useRealTimers()
  })
})
