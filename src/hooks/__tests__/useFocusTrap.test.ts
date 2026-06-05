import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'

describe('useFocusTrap', () => {
  it('no hace nada cuando isActive=false', () => {
    const ref = { current: document.createElement('div') }
    let called = false
    renderHook(() => useFocusTrap(ref, false, () => { called = true }))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(called).toBe(false)
  })
})
