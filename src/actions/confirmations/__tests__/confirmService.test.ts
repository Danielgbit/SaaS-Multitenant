import { describe, it, expect } from 'vitest'
import { canConfirm, calculateTotal } from '../helpers'
import type { ConfirmationStatus } from '@/types/confirmations'
import type { ServiceWithPrice, EmployeeServiceOverride } from '../helpers'

describe('confirmService — state transition logic', () => {
  it('allows confirm when status is completed', () => {
    expect(canConfirm('completed').allowed).toBe(true)
  })

  it('allows confirm when status is needs_review', () => {
    expect(canConfirm('needs_review').allowed).toBe(true)
  })

  it('rejects confirm when already confirmed', () => {
    const result = canConfirm('confirmed')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('ya fue confirmada')
  })

  it('rejects confirm when still scheduled (employee not done)', () => {
    const result = canConfirm('scheduled')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('no fue marcada')
  })

  it('rejects confirm when pending_confirmation (employee not done)', () => {
    const result = canConfirm('pending_confirmation')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('no fue marcada')
  })
})

describe('confirmService — price calculation', () => {
  it('total = base price + adjustment, no overrides', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 50000 },
    ]
    const overrides: EmployeeServiceOverride[] = []
    expect(calculateTotal(services, overrides, 10000)).toBe(60000)
  })

  it('override replaces base price', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 50000 },
    ]
    const overrides: EmployeeServiceOverride[] = [
      { service_id: 's1', price_override: 45000 },
    ]
    expect(calculateTotal(services, overrides, 0)).toBe(45000)
  })

  it('multiple services with mixed overrides', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 50000 },
      { service_id: 's2', price: 30000 },
    ]
    const overrides: EmployeeServiceOverride[] = [
      { service_id: 's1', price_override: 45000 },
    ]
    expect(calculateTotal(services, overrides, 0)).toBe(75000)
  })

  it('total = base price when no adjustment', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 50000 },
    ]
    expect(calculateTotal(services, [], 0)).toBe(50000)
  })

  it('adjustment can be negative (discount)', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 50000 },
    ]
    expect(calculateTotal(services, [], -5000)).toBe(45000)
  })

  it('empty services returns 0', () => {
    expect(calculateTotal([], [], 0)).toBe(0)
  })

  it('adjustment with empty services returns adjustment value', () => {
    expect(calculateTotal([], [], 10000)).toBe(10000)
  })
})

// Test-only utility: documenta qué roles pueden confirmar
// NO usado en producción — la autorización real usa requireOrgAccess
describe('confirmService — authorization roles (test-only)', () => {
  type Role = 'owner' | 'admin' | 'staff' | 'empleado'

  function canConfirmService(role: Role): boolean {
    return role === 'owner' || role === 'admin' || role === 'staff'
  }

  it('allows owner to confirm', () => expect(canConfirmService('owner')).toBe(true))
  it('allows admin to confirm', () => expect(canConfirmService('admin')).toBe(true))
  it('allows staff to confirm', () => expect(canConfirmService('staff')).toBe(true))
  it('rejects employee from confirming', () => expect(canConfirmService('empleado')).toBe(false))
})

// Test double para comportamiento orquestado (no es lógica pura)
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
