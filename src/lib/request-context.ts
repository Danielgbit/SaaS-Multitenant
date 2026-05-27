import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestContext = {
  requestId: string
  organizationId?: string
  userId?: string
  flow?: string
}

const storage = new AsyncLocalStorage<RequestContext>()

export function withRequestContext<T>(
  requestId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run({ requestId: requestId ?? crypto.randomUUID() }, fn)
}

export function setRequestContext(partial: Partial<RequestContext>): void {
  const current = storage.getStore()
  if (current) {
    storage.enterWith({ ...current, ...partial })
  }
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore()
}

export function getRequestId(): string {
  const requestId = storage.getStore()?.requestId
  if (!requestId) {
    console.warn('[request-context] getRequestId called outside context')
    return crypto.randomUUID()
  }
  return requestId
}
