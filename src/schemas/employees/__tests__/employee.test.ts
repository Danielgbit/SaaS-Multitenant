import { describe, it, expect } from 'vitest'
import { CreateEmployeeSchema, UpdateEmployeeSchema } from '@/schemas/employees/employee.schema'

describe('CreateEmployeeSchema', () => {
  it('accepts valid employee with name only', () => {
    const result = CreateEmployeeSchema.safeParse({ name: 'Ana García' })
    expect(result.success).toBe(true)
  })

  it('accepts employee with phone and email', () => {
    const result = CreateEmployeeSchema.safeParse({
      name: 'María Pérez',
      phone: '3001234567',
      email: 'maria@test.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = CreateEmployeeSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name with numbers', () => {
    const result = CreateEmployeeSchema.safeParse({ name: 'Ana123' })
    expect(result.success).toBe(false)
  })

  it('accepts empty phone', () => {
    const result = CreateEmployeeSchema.safeParse({ name: 'Ana García', phone: '' })
    expect(result.success).toBe(true)
  })

  it('accepts phone with formatting (parentheses, dashes)', () => {
    const result = CreateEmployeeSchema.safeParse({ name: 'Ana García', phone: '(300) 123-4567' })
    expect(result.success).toBe(true)
  })

  it('accepts empty email', () => {
    const result = CreateEmployeeSchema.safeParse({ name: 'Ana García', email: '' })
    expect(result.success).toBe(true)
  })

  it('normalizes email', () => {
    const result = CreateEmployeeSchema.safeParse({
      name: 'Ana García',
      email: '  TEST@MAIL.COM  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@mail.com')
    }
  })

  it('rejects invalid email', () => {
    const result = CreateEmployeeSchema.safeParse({ name: 'Ana García', email: 'not-email' })
    expect(result.success).toBe(false)
  })

  it('rejects XSS in name', () => {
    const result = CreateEmployeeSchema.safeParse({
      name: '<img src=x onerror=alert(1)>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects svg onload in name', () => {
    const result = CreateEmployeeSchema.safeParse({
      name: '<svg onload=alert(1)>',
    })
    expect(result.success).toBe(false)
  })

  it('trims name', () => {
    const result = CreateEmployeeSchema.safeParse({ name: '  Carlos  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Carlos')
    }
  })
})

describe('UpdateEmployeeSchema', () => {
  it('accepts valid update with id', () => {
    const result = UpdateEmployeeSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Carlos López',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid uuid', () => {
    const result = UpdateEmployeeSchema.safeParse({
      id: 'bad-id',
      name: 'Carlos López',
    })
    expect(result.success).toBe(false)
  })
})
