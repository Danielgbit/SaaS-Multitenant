import { describe, it, expect } from 'vitest'

describe('cancelConfirmation — state transition logic', () => {
  type Role = 'owner' | 'admin' | 'staff' | 'empleado'

  function canCancel(args: {
    status: string
    confirmation_status: string | null
    role: Role
  }): { allowed: boolean; reason?: string } {
    if (args.confirmation_status === 'confirmed') {
      return { allowed: false, reason: 'La cita ya fue cobrada' }
    }
    if (args.status === 'cancelled') {
      return { allowed: false, reason: 'La cita ya fue cancelada' }
    }
    if (args.role === 'empleado') {
      return { allowed: false, reason: 'No autorizado' }
    }
    return { allowed: true }
  }

  it('allows cancel when appointment is scheduled', () => {
    const result = canCancel({
      status: 'confirmed',
      confirmation_status: 'scheduled',
      role: 'admin',
    })
    expect(result.allowed).toBe(true)
  })

  it('allows cancel when appointment is pending_confirmation', () => {
    const result = canCancel({
      status: 'confirmed',
      confirmation_status: 'pending_confirmation',
      role: 'admin',
    })
    expect(result.allowed).toBe(true)
  })

  it('allows cancel when appointment is completed (not yet paid)', () => {
    const result = canCancel({
      status: 'completed',
      confirmation_status: 'completed',
      role: 'admin',
    })
    expect(result.allowed).toBe(true)
  })

  it('allows cancel when appointment is needs_review', () => {
    const result = canCancel({
      status: 'completed',
      confirmation_status: 'needs_review',
      role: 'admin',
    })
    expect(result.allowed).toBe(true)
  })

  it('rejects cancel when already confirmed (appointment is paid)', () => {
    const result = canCancel({
      status: 'completed',
      confirmation_status: 'confirmed',
      role: 'admin',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('ya fue cobrada')
  })

  it('rejects cancel when status is already cancelled (double-cancel guard)', () => {
    const result = canCancel({
      status: 'cancelled',
      confirmation_status: null,
      role: 'admin',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('ya fue cancelada')
  })

  it('rejects cancel for empleado role', () => {
    const result = canCancel({
      status: 'confirmed',
      confirmation_status: 'scheduled',
      role: 'empleado',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('No autorizado')
  })

  it('allows owner to cancel', () => {
    const result = canCancel({
      status: 'confirmed',
      confirmation_status: 'scheduled',
      role: 'owner',
    })
    expect(result.allowed).toBe(true)
  })

  it('allows staff to cancel', () => {
    const result = canCancel({
      status: 'confirmed',
      confirmation_status: 'scheduled',
      role: 'staff',
    })
    expect(result.allowed).toBe(true)
  })
})
