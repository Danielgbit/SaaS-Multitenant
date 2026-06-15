import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHydratedValue } from '../useHydratedValue'

const STORAGE_KEY = 'test-key'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('useHydratedValue', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => useHydratedValue('default', STORAGE_KEY))
    expect(result.current[0]).toBe('default')
  })

  it('reads stored value from localStorage after mount', () => {
    localStorage.setItem(STORAGE_KEY, 'stored')
    const { result } = renderHook(() => useHydratedValue('default', STORAGE_KEY))
    expect(result.current[0]).toBe('stored')
    expect(result.current[2]).toBe(true)
  })

  it('writes to localStorage when value changes', () => {
    const { result } = renderHook(() => useHydratedValue('default', STORAGE_KEY))
    act(() => { result.current[1]('new-value' as 'default') })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('new-value')
  })

  it('persists value to localStorage on mount', () => {
    const { result } = renderHook(() => useHydratedValue('default', STORAGE_KEY))
    expect(result.current[0]).toBe('default')
    expect(result.current[2]).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('default')
  })
})
