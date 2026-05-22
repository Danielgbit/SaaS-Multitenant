import { use, useMemo, type ReactNode } from 'react'

type PromiseResult<T> = [T, null] | [null, Error]

export function useServerAction<T>(
  action: () => Promise<T>,
  deps: unknown[]
): T {
  const promise = useMemo(action, deps)
  return use(promise)
}

export function useServerActionResult<T extends { success: boolean; error?: string }>(
  action: () => Promise<T>,
  deps: unknown[]
): T {
  const result = useServerAction(action, deps)
  if (!result.success) {
    throw new Error(result.error || 'Error desconocido')
  }
  return result
}

export function withSuspense<
  T extends { success: boolean; error?: string; data?: unknown }
>(
  Component: (props: any) => ReactNode,
  actionFactory: (props: any) => () => Promise<T>
) {
  return function SuspenseWrapper(props: any) {
    const result = useServerAction(actionFactory(props), Object.values(props))
    if (!result.success) {
      throw new Error(result.error || 'Error')
    }
    return <Component {...props} data={result.data!} />
  }
}
