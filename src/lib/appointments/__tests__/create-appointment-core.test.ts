import { describe, it, expect } from 'vitest'
import { validateCreateInput, computeAppointmentTimes } from '../create-appointment-core'

const UUID = () => crypto.randomUUID()

describe('validateCreateInput', () => {
  it('acepta input válido', () => {
    const result = validateCreateInput({
      employee_id: UUID(),
      client_id: UUID(),
      service_id: UUID(),
      start_time: '2026-05-22T10:00:00.000Z',
      organization_id: UUID(),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.employee_id).toBeDefined()
    }
  })

  it('acepta input con notas opcionales', () => {
    const result = validateCreateInput({
      employee_id: UUID(),
      client_id: UUID(),
      service_id: UUID(),
      start_time: '2026-05-22T10:00:00.000Z',
      organization_id: UUID(),
      notes: 'Cliente nuevo',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza employee_id inválido', () => {
    const result = validateCreateInput({
      employee_id: 'not-a-uuid',
      client_id: UUID(),
      service_id: UUID(),
      start_time: '2026-05-22T10:00:00.000Z',
      organization_id: UUID(),
    })
    expect(result.success).toBe(false)
  })

  it('rechaza entrada vacía', () => {
    const result = validateCreateInput({})
    expect(result.success).toBe(false)
  })

  it('rechaza null', () => {
    const result = validateCreateInput(null)
    expect(result.success).toBe(false)
  })
})

describe('computeAppointmentTimes', () => {
  it('calcula end_time correctamente (30 min)', () => {
    const result = computeAppointmentTimes('2026-05-22T10:00:00.000Z', 30)
    const startMs = result.startDate.getTime()
    const endMs = result.endDate.getTime()
    expect(endMs - startMs).toBe(30 * 60 * 1000)
  })

  it('normaliza timestamps con Z', () => {
    const result = computeAppointmentTimes('2026-05-22T10:00:00.000Z', 60)
    expect(result.normalizedStart).not.toContain('Z')
  })

  it('maneja duración de 0 minutos', () => {
    const result = computeAppointmentTimes('2026-05-22T10:00:00.000Z', 0)
    expect(result.startDate.getTime()).toBe(result.endDate.getTime())
  })

  it('maneja duraciones largas (120 min)', () => {
    const result = computeAppointmentTimes('2026-05-22T10:00:00.000Z', 120)
    const diffMs = result.endDate.getTime() - result.startDate.getTime()
    expect(diffMs).toBe(120 * 60 * 1000)
  })
})
