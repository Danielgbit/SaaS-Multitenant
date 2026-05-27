import { AsyncLocalStorage } from 'node:async_hooks'

type RequestContext = {
  requestId: string
}

const storage = new AsyncLocalStorage<RequestContext>()

export function withRequestContext<T>(
  requestId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run({ requestId: requestId ?? crypto.randomUUID() }, fn)
}

export function getRequestId(): string {
  const requestId = storage.getStore()?.requestId
  if (!requestId) {
    console.warn('[request-context] getRequestId called outside context')
    return crypto.randomUUID()
  }
  return requestId
}
