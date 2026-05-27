import { describe, it, expect } from 'vitest'

describe('markCompleted — state transition logic', () => {
  type ConfirmationStatus = 'scheduled' | 'completed' | 'confirmed' | 'needs_review'

  function canMarkCompleted(
    status: ConfirmationStatus,
    employeeId: string | null,
    userId: string,
  ): { allowed: boolean; reason?: string } {
    if (!employeeId) return { allowed: false, reason: 'Cita no asignada' }
    if (employeeId !== userId) return { allowed: false, reason: 'No autorizado' }
    if (status === 'confirmed') return { allowed: false, reason: 'La cita ya fue cobrada' }
    if (status === 'completed') return { allowed: false, reason: 'Ya marcaste completado' }
    if (status === 'scheduled' || status === 'needs_review') return { allowed: true }
    return { allowed: false, reason: 'Estado inválido' }
  }

  it('allows when employee is assigned and status is scheduled', () => {
    const result = canMarkCompleted('scheduled', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(true)
  })

  it('allows when employee is assigned and status is needs_review', () => {
    const result = canMarkCompleted('needs_review', 'emp-1', 'emp-1')
    expect(result.allowed).toBe(true)
  })

  it('rejects when employee is not the assigned one', () => {
    const result = canMarkCompleted('scheduled', 'emp-1', 'emp-2')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('No autorizado')
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
  function calculateTotal(
    basePrice: number,
    adjustment: number,
    overrides: Array<{ serviceId: string; priceOverride?: number }>,
  ): number {
    return basePrice + adjustment
  }

  it('total = base price when no adjustment', () => {
    expect(calculateTotal(35000, 0, [])).toBe(35000)
  })

  it('total = base price + adjustment', () => {
    expect(calculateTotal(35000, 10000, [])).toBe(45000)
  })

  it('total with zero base price', () => {
    expect(calculateTotal(0, 5000, [])).toBe(5000)
  })
})
