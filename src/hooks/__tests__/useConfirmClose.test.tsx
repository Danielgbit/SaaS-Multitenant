import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useConfirmClose } from '../useConfirmClose'
import type { ReactNode } from 'react'

function Harness({
  isDirty,
  onClose,
  message,
}: {
  isDirty: boolean
  onClose: () => void
  message?: string
}) {
  const { confirmClose, dialog } = useConfirmClose(isDirty, onClose, message)
  return (
    <>
      <button onClick={confirmClose}>close</button>
      {dialog}
    </>
  )
}

describe('useConfirmClose', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onClose directly when isDirty = false', () => {
    const onClose = vi.fn()
    render(<Harness isDirty={false} onClose={onClose} />)
    fireEvent.click(screen.getByText('close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows confirm modal when isDirty = true', () => {
    const onClose = vi.fn()
    render(<Harness isDirty={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('close'))
    expect(screen.getByText('Descartar cambios')).toBeInTheDocument()
  })

  it('hides confirm and does NOT call onClose on cancel', () => {
    const onClose = vi.fn()
    render(<Harness isDirty={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('close'))
    fireEvent.click(screen.getByText('Seguir editando'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText('Descartar cambios')).not.toBeInTheDocument()
  })

  it('calls onClose after confirm', () => {
    const onClose = vi.fn()
    render(<Harness isDirty={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('close'))
    fireEvent.click(screen.getByText('Descartar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses custom message when provided', () => {
    const onClose = vi.fn()
    const customMessage = 'Salir sin guardar los datos ingresados?'
    render(<Harness isDirty={true} onClose={onClose} message={customMessage} />)
    fireEvent.click(screen.getByText('close'))
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })
})
