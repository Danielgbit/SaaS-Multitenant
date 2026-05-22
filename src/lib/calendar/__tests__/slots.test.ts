import { describe, it, expect } from 'vitest'
import { categorizeSlots } from '../slots'
import type { TimeSlot } from '@/types/calendar'

function makeSlot(start: string): TimeSlot {
  return { start_time: `2026-05-22T${start}:00.000Z`, end_time: `2026-05-22T${start}:00.000Z`, available: true }
}

describe('categorizeSlots', () => {
  it('clasifica slots matutinos (antes de las 13:00)', () => {
    const slots = [makeSlot('09:00'), makeSlot('10:30'), makeSlot('11:45')]
    const result = categorizeSlots(slots)
    expect(result.morning).toHaveLength(3)
    expect(result.afternoon).toHaveLength(0)
  })

  it('clasifica slots vespertinos (después de las 13:00)', () => {
    const slots = [makeSlot('14:00'), makeSlot('15:30'), makeSlot('17:00')]
    const result = categorizeSlots(slots)
    expect(result.morning).toHaveLength(0)
    expect(result.afternoon).toHaveLength(3)
  })

  it('maneja slots exactamente a las 13:00 como tarde', () => {
    const slots = [makeSlot('13:00')]
    const result = categorizeSlots(slots)
    expect(result.morning).toHaveLength(0)
    expect(result.afternoon).toHaveLength(1)
  })

  it('separa correctamente slots mixtos', () => {
    const slots = [makeSlot('09:00'), makeSlot('12:00'), makeSlot('13:00'), makeSlot('18:00')]
    const result = categorizeSlots(slots)
    expect(result.morning).toHaveLength(2)
    expect(result.afternoon).toHaveLength(2)
  })

  it('retorna arrays vacíos para entrada vacía', () => {
    const result = categorizeSlots([])
    expect(result.morning).toEqual([])
    expect(result.afternoon).toEqual([])
  })

  it('maneja slots con diferentes formatos de hora', () => {
    const slots = [makeSlot('00:00'), makeSlot('23:59')]
    const result = categorizeSlots(slots)
    expect(result.morning).toHaveLength(1)
    expect(result.afternoon).toHaveLength(1)
  })
})
