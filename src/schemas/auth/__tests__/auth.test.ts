import { describe, it, expect } from 'vitest'
import { LoginSchema, RegisterSchema } from '@/schemas/auth/auth.schema'

describe('LoginSchema', () => {
  it('accepts valid login', () => {
    const result = LoginSchema.safeParse({
      email: 'test@mail.com',
      password: 'mypassword',
    })
    expect(result.success).toBe(true)
  })

  it('normalizes email', () => {
    const result = LoginSchema.safeParse({
      email: '  TEST@MAIL.COM  ',
      password: 'mypassword',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@mail.com')
    }
  })

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-email', password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({ email: 'test@mail.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('RegisterSchema', () => {
  const validInput = {
    businessName: 'Mi Spa',
    fullName: 'María García',
    email: 'maria@test.com',
    password: 'SecurePass1!',
    confirmPassword: 'SecurePass1!',
  }

  it('accepts valid registration', () => {
    const result = RegisterSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects when confirmPassword does not match', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      confirmPassword: 'DifferentPass1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmIssue = result.error.issues.find(i => i.path[0] === 'confirmPassword')
      expect(confirmIssue).toBeDefined()
    }
  })

  it('rejects weak password (no uppercase)', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      password: 'securepass1!',
      confirmPassword: 'securepass1!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects weak password (no number)', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      password: 'SecurePass!',
      confirmPassword: 'SecurePass!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects weak password (no special char)', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      password: 'SecurePass1',
      confirmPassword: 'SecurePass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password (< 8)', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty business name', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      businessName: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid full name with numbers', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      fullName: 'Maria123',
    })
    expect(result.success).toBe(false)
  })

  it('normalizes email', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      email: '  MARIA@TEST.COM  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('maria@test.com')
    }
  })

  it('rejects XSS in full name', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      fullName: '<script>alert(1)</script>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects XSS in business name', () => {
    const result = RegisterSchema.safeParse({
      ...validInput,
      businessName: '<img src=x onerror=alert(1)>',
    })
    expect(result.success).toBe(false)
  })
})
