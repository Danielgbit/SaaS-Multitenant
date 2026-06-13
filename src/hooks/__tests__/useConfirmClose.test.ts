import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfirmClose } from '../useConfirmClose'

describe('useConfirmClose', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('calls onClose directly when isDirty = false', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useConfirmClose(false, onClose))
    act(() => { result.current.confirmClose() })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows confirm and calls onClose if confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onClose = vi.fn()
    const { result } = renderHook(() => useConfirmClose(true, onClose))
    act(() => { result.current.confirmClose() })
    expect(window.confirm).toHaveBeenCalledWith('¿Descartar cambios sin guardar?')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows confirm and does NOT call onClose if cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onClose = vi.fn()
    const { result } = renderHook(() => useConfirmClose(true, onClose))
    act(() => { result.current.confirmClose() })
    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('uses custom message when provided', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onClose = vi.fn()
    const customMessage = '¿Salir sin guardar los datos ingresados?'
    const { result } = renderHook(() => useConfirmClose(true, onClose, customMessage))
    act(() => { result.current.confirmClose() })
    expect(window.confirm).toHaveBeenCalledWith(customMessage)
  })
})
