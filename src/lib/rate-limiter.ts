type LogEntry = {
  type: 'rate_limit_exceeded'
  ip: string
  route: string
  userId?: string
  organizationId?: string
  timestamp: string
}

export type RateLimitConfig = {
  maxRequests: number
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetMs: number
}

export function createRateLimiter(config: RateLimitConfig) {
  const hits = new Map<string, number[]>()
  const MAX_MAP_SIZE = 10_000
  let lastCleanup = Date.now()
  const CLEANUP_INTERVAL_MS = 60_000

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
    lastCleanup = now
    for (const [key, timestamps] of hits) {
      const active = timestamps.filter(t => now - t < config.windowMs)
      if (active.length === 0) hits.delete(key)
      else hits.set(key, active)
    }
  }

  function log(entry: LogEntry) {
    console.warn(JSON.stringify(entry))
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      const timestamps = hits.get(key) || []
      const active = timestamps.filter(t => now - t < config.windowMs)

      if (hits.size > MAX_MAP_SIZE) cleanup()

      return {
        allowed: active.length < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - active.length),
        resetMs: active.length > 0 ? config.windowMs - (now - active[0]) : 0,
      }
    },

    hit(key: string, meta?: { ip?: string; route?: string; userId?: string; organizationId?: string }): void {
      const now = Date.now()
      const timestamps = hits.get(key) || []
      timestamps.push(now)
      hits.set(key, timestamps)

      if (timestamps.length === config.maxRequests + 1) {
        log({
          type: 'rate_limit_exceeded',
          ip: meta?.ip || 'unknown',
          route: meta?.route || 'unknown',
          userId: meta?.userId,
          timestamp: new Date().toISOString(),
        })
      }
    },

    getSize(): number {
      return hits.size
    },
  }
}

export const authLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })
export const registerLimiter = createRateLimiter({ maxRequests: 3, windowMs: 300_000 })
export const webhookLimiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 })
export const serverActionLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 })
export const createEmployeeLimiter = createRateLimiter({ maxRequests: 20, windowMs: 600_000 })
export const createInvitationLimiter = createRateLimiter({ maxRequests: 10, windowMs: 3_600_000 })
