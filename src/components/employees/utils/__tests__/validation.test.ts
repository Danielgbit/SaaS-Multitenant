import { describe, it, expect } from 'vitest'
import { validateEmployeeFields } from '../validation'

describe('validateEmployeeFields', () => {
  it('returns empty errors for valid name without phone', () => {
    const errors = validateEmployeeFields('María Pérez', '')
    expect(Object.keys(errors).length).toBe(0)
  })

  it('returns empty errors for valid name with valid phone', () => {
    const errors = validateEmployeeFields('Carlos López', '3001234567')
    expect(Object.keys(errors).length).toBe(0)
  })

  it('returns error for empty name', () => {
    const errors = validateEmployeeFields('', '')
    expect(errors.name).toBeDefined()
  })

  it('returns error for name with numbers', () => {
    const errors = validateEmployeeFields('Ana123', '')
    expect(errors.name).toBeDefined()
  })

  it('returns error for name with HTML', () => {
    const errors = validateEmployeeFields('<script>alert(1)</script>', '')
    expect(errors.name).toBeDefined()
  })

  it('returns error for invalid phone', () => {
    const errors = validateEmployeeFields('Ana García', '123')
    expect(errors.phone).toBeDefined()
  })

  it('accepts phone with formatting', () => {
    const errors = validateEmployeeFields('Ana García', '(300) 123-4567')
    expect(Object.keys(errors).length).toBe(0)
  })

  it('accepts short name (2 chars)', () => {
    const errors = validateEmployeeFields('An', '')
    expect(Object.keys(errors).length).toBe(0)
  })

  it('trims whitespace from name', () => {
    const errors = validateEmployeeFields('  Ana  ', '')
    expect(Object.keys(errors).length).toBe(0)
  })
})
