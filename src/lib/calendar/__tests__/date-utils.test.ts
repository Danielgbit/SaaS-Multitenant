import { describe, it, expect } from 'vitest'
import {
  getMonday, getWeekDates, formatDateKey, formatTime,
  formatMonthYear, isToday, getWeekRange, groupAppointmentsByDay,
} from '../date-utils'
import type { AppointmentWithDetails } from '@/types/calendar'

describe('getMonday', () => {
  it('retorna lunes para un miércoles', () => {
    const wed = new Date('2026-05-20T12:00:00Z') // miércoles
    const mon = getMonday(wed)
    expect(mon.toISOString().split('T')[0]).toBe('2026-05-18')
  })

  it('retorna el mismo día si ya es lunes', () => {
    const mon = new Date('2026-05-18T12:00:00Z')
    expect(getMonday(mon).toISOString().split('T')[0]).toBe('2026-05-18')
  })

  it('retorna lunes anterior para domingo', () => {
    const sun = new Date('2026-05-24T12:00:00Z')
    expect(getMonday(sun).toISOString().split('T')[0]).toBe('2026-05-18')
  })
})

describe('getWeekDates', () => {
  it('retorna 7 fechas empezando por lunes', () => {
    const dates = getWeekDates(new Date('2026-05-20T12:00:00Z'))
    expect(dates).toHaveLength(7)
    expect(formatDateKey(dates[0])).toBe('2026-05-18')
    expect(formatDateKey(dates[6])).toBe('2026-05-24')
  })
})

describe('formatDateKey', () => {
  it('formatea fecha a YYYY-MM-DD', () => {
    expect(formatDateKey(new Date('2026-05-22T12:00:00Z'))).toBe('2026-05-22')
  })
})

describe('formatTime', () => {
  it('formatea hora en español', () => {
    const result = formatTime('2026-05-22T14:30:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatMonthYear', () => {
  it('retorna mes y año en español', () => {
    const result = formatMonthYear(new Date('2026-05-22'))
    expect(result.toLowerCase()).toContain('mayo')
    expect(result).toContain('2026')
  })
})

describe('isToday', () => {
  it('retorna true para la fecha actual', () => {
    expect(isToday(new Date())).toBe(true)
  })

  it('retorna false para una fecha diferente', () => {
    expect(isToday(new Date('2025-01-01'))).toBe(false)
  })
})

describe('getWeekRange', () => {
  it('retorna rango formateado', () => {
    const dates = getWeekDates(new Date('2026-05-20'))
    const range = getWeekRange(dates)
    expect(range).toContain('may')
    expect(range).toContain('-')
  })

  it('retorna vacío para array vacío', () => {
    expect(getWeekRange([])).toBe('')
  })
})

describe('groupAppointmentsByDay', () => {
  const mon = new Date(2026, 4, 18) // May 18, local time
  const weekDates = getWeekDates(mon)

  const baseApt = {
    id: '1',
    organization_id: 'org-1',
    client_id: 'c1',
    employee_id: 'e1',
    start_time: '2026-05-18T10:00:00.000Z',
    end_time: '2026-05-18T11:00:00.000Z',
    status: 'confirmed',
    created_at: '2026-05-18T09:00:00.000Z',
  } as AppointmentWithDetails

  it('agrupa citas por fecha', () => {
    const apt2 = { ...baseApt, id: '2', start_time: '2026-05-19T10:00:00.000Z', end_time: '2026-05-19T11:00:00.000Z' }
    const grouped = groupAppointmentsByDay([baseApt, apt2], weekDates)
    expect(grouped['2026-05-18']).toHaveLength(1)
    expect(grouped['2026-05-19']).toHaveLength(1)
  })

  it('incluye todos los días aunque no tengan citas', () => {
    const grouped = groupAppointmentsByDay([], weekDates)
    expect(Object.keys(grouped)).toHaveLength(7)
  })

  it('ignora citas fuera del rango de la semana', () => {
    const outside = { ...baseApt, start_time: '2026-06-01T10:00:00Z', end_time: '2026-06-01T11:00:00Z' }
    const grouped = groupAppointmentsByDay([outside], weekDates)
    const totalAppointments = Object.values(grouped).flat().length
    expect(totalAppointments).toBe(0)
  })
})
