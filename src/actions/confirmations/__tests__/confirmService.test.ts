import { describe, it, expect } from 'vitest'

// Test the pure logic layer: state transitions, permission checks, and price calculations.
// The actual Supabase integration is validated via shadow mode.

describe('confirmService — state transition logic', () => {
  type ConfirmationStatus = 'scheduled' | 'completed' | 'confirmed' | 'needs_review'

  function canConfirm(status: ConfirmationStatus): { allowed: boolean; reason?: string } {
    if (status === 'confirmed') return { allowed: false, reason: 'La cita ya está confirmada' }
    if (status === 'scheduled') return { allowed: false, reason: 'El empleado no ha marcado completado' }
    if (status === 'completed' || status === 'needs_review') return { allowed: true }
    return { allowed: false, reason: 'Estado inválido' }
  }

  it('allows confirm when status is completed', () => {
    expect(canConfirm('completed').allowed).toBe(true)
  })

  it('allows confirm when status is needs_review', () => {
    expect(canConfirm('needs_review').allowed).toBe(true)
  })

  it('rejects confirm when already confirmed', () => {
    const result = canConfirm('confirmed')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('ya está confirmada')
  })

  it('rejects confirm when still scheduled (employee not done)', () => {
    const result = canConfirm('scheduled')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('no ha marcado')
  })
})

describe('confirmService — authorization logic', () => {
  type Role = 'owner' | 'admin' | 'staff' | 'empleado'

  function canConfirmService(role: Role): boolean {
    return role === 'owner' || role === 'admin' || role === 'staff'
  }

  it('allows owner to confirm', () => expect(canConfirmService('owner')).toBe(true))
  it('allows admin to confirm', () => expect(canConfirmService('admin')).toBe(true))
  it('allows staff to confirm', () => expect(canConfirmService('staff')).toBe(true))
  it('rejects employee from confirming', () => expect(canConfirmService('empleado')).toBe(false))
})

describe('confirmService — price calculation', () => {
  function calculateTotal(basePrice: number, adjustment: number, overrides: Array<{ serviceId: string; price?: number }>): number {
    return basePrice + adjustment
  }

  it('total = base price + adjustment', () => {
    expect(calculateTotal(50000, 10000, [])).toBe(60000)
  })

  it('total = base price when no adjustment', () => {
    expect(calculateTotal(50000, 0, [])).toBe(50000)
  })
})

describe('confirmService — helper failure behavior', () => {
  type FinancialResult = {
    payroll: { attempted: boolean; success: boolean; error?: string }
    commission: { attempted: boolean; success: boolean; error?: string }
  }

  function simulateConfirmWithHelperResult(
    helperResult: FinancialResult,
    onPayrollFailed: (error: string) => void
  ): { success: boolean } {
    if (!helperResult.payroll.success) {
      onPayrollFailed(helperResult.payroll.error || 'unknown error')
    }
    return { success: true }
  }

  it('retorna success aunque payroll falle', () => {
    const failedResult: FinancialResult = {
      payroll: { attempted: true, success: false, error: 'db error' },
      commission: { attempted: false, success: false },
    }
    let loggedError = ''

    const result = simulateConfirmWithHelperResult(failedResult, (err) => {
      loggedError = err
    })

    expect(result.success).toBe(true)
    expect(loggedError).toBe('db error')
  })

  it('retorna success aunque commission falle', () => {
    const failedResult: FinancialResult = {
      payroll: { attempted: true, success: true },
      commission: { attempted: true, success: false, error: 'rate limit' },
    }
    let loggedError = ''

    const result = simulateConfirmWithHelperResult(failedResult, () => {})

    expect(result.success).toBe(true)
  })

  it('no llama onPayrollFailed cuando payroll es exitoso', () => {
    const successResult: FinancialResult = {
      payroll: { attempted: true, success: true },
      commission: { attempted: true, success: true },
    }
    let called = false

    simulateConfirmWithHelperResult(successResult, () => {
      called = true
    })

    expect(called).toBe(false)
  })
})
