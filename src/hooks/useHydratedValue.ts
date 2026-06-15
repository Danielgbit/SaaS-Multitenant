'use client'

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'

export function useHydratedValue<T extends string>(
  initial: T,
  storageKey: string
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        setValue(stored as T)
      }
    } catch {
      /* noop */
    }
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      /* noop */
    }
  }, [value, storageKey, hydrated])

  return [value, setValue, hydrated]
}
