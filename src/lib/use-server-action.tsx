"use client"

import { useEffect, useRef, useState } from "react"

interface ServerActionState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useServerAction<T>(
  action: () => Promise<T>,
  deps: unknown[]
): ServerActionState<T> {
  const [state, setState] = useState<ServerActionState<T>>({
    data: null,
    error: null,
    loading: true,
  })

  const requestIdRef = useRef(0)
  const actionRef = useRef(action)
  actionRef.current = action

  useEffect(() => {
    let mounted = true
    const requestId = ++requestIdRef.current

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }))

    actionRef.current()
      .then(data => {
        if (!mounted) return
        if (requestId !== requestIdRef.current) return

        setState({
          data,
          error: null,
          loading: false,
        })
      })
      .catch(error => {
        if (!mounted) return
        if (requestId !== requestIdRef.current) return

        setState({
          data: null,
          error,
          loading: false,
        })
      })

    return () => {
      mounted = false
    }
  }, deps)

  return state
}
