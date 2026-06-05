import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollLock } from '../useScrollLock'

describe('useScrollLock', () => {
  it('bloquea scroll cuando isLocked=true', () => {
    const { unmount } = renderHook(() => useScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('no bloquea scroll cuando isLocked=false', () => {
    renderHook(() => useScrollLock(false))
    expect(document.body.style.overflow).toBe('')
  })
})
