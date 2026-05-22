import { describe, it, expect } from 'vitest'
import { validateUpdateStatusInput } from '../update-appointment-core'

const UUID = () => crypto.randomUUID()

describe('validateUpdateStatusInput', () => {
  it('acepta input válido con status cancelado (una L)', () => {
    const result = validateUpdateStatusInput({
      appointment_id: UUID(),
      status: 'canceled',
    })
    expect(result.success).toBe(true)
  })

  it('acepta todos los status válidos', () => {
    const statuses = ['pending', 'confirmed', 'completed', 'canceled', 'no_show'] as const
    for (const status of statuses) {
      const result = validateUpdateStatusInput({
        appointment_id: UUID(),
        status,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rechaza status con doble L (cancelled)', () => {
    const result = validateUpdateStatusInput({
      appointment_id: UUID(),
      status: 'cancelled',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza appointment_id inválido', () => {
    const result = validateUpdateStatusInput({
      appointment_id: 'no-es-uuid',
      status: 'canceled',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza status inválido', () => {
    const result = validateUpdateStatusInput({
      appointment_id: UUID(),
      status: 'invalid_status',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza entrada vacía', () => {
    const result = validateUpdateStatusInput({})
    expect(result.success).toBe(false)
  })
})
