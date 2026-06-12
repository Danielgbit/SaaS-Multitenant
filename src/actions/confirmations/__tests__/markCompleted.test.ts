import { describe, it, expect } from 'vitest'
import { canMarkCompleted, calculateTotal } from '../helpers'
import type { ConfirmationStatus } from '@/types/confirmations'
import type { ServiceWithPrice, EmployeeServiceOverride } from '../helpers'

describe('markCompleted — state transition logic', () => {
  it('allows when employee is assigned and status is scheduled', () => {
    const result = canMarkCompleted('scheduled', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(true)
  })

  it('allows when employee is assigned and status is pending_confirmation', () => {
    const result = canMarkCompleted('pending_confirmation', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(true)
  })

  it('allows when employee is assigned and status is needs_review', () => {
    const result = canMarkCompleted('needs_review', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(true)
  })

  it('rejects when employee is not the assigned one', () => {
    const result = canMarkCompleted('scheduled', 'emp-1', 'emp-2')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('tus propias citas')
  })

  it('rejects when appointment is already confirmed', () => {
    const result = canMarkCompleted('confirmed', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('ya fue cobrada')
  })

  it('rejects when already completed (double mark)', () => {
    const result = canMarkCompleted('completed', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Ya marcaste')
  })

  it('rejects when appointment has no employee assigned', () => {
    const result = canMarkCompleted('scheduled', null, 'emp-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Cita no asignada')
  })
})

describe('markCompleted — price calculation', () => {
  it('total = base price when no adjustment', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 35000 },
    ]
    expect(calculateTotal(services, [], 0)).toBe(35000)
  })

  it('total = base price + adjustment', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 35000 },
    ]
    expect(calculateTotal(services, [], 10000)).toBe(45000)
  })

  it('override applies to markCompleted price', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 35000 },
    ]
    const overrides: EmployeeServiceOverride[] = [
      { service_id: 's1', price_override: 30000 },
    ]
    expect(calculateTotal(services, overrides, 0)).toBe(30000)
  })

  it('total with zero base price', () => {
    const services: ServiceWithPrice[] = [
      { service_id: 's1', price: 0 },
    ]
    expect(calculateTotal(services, [], 5000)).toBe(5000)
  })
})
