import { describe, it, expect } from 'vitest'
import { colombianNameSchema, emailSchema, passwordSchema, sanitizeText, timeToMinutes } from '@/schemas/common'

describe('colombianNameSchema', () => {
  it('accepts valid names with tildes and ñ', () => {
    expect(colombianNameSchema.safeParse('María José').success).toBe(true)
    expect(colombianNameSchema.safeParse('Álvaro Núñez').success).toBe(true)
    expect(colombianNameSchema.safeParse('Francisca').success).toBe(true)
  })

  it('rejects empty string', () => {
    expect(colombianNameSchema.safeParse('').success).toBe(false)
  })

  it('rejects strings with only spaces', () => {
    expect(colombianNameSchema.safeParse('   ').success).toBe(false)
  })

  it('rejects strings with numbers', () => {
    expect(colombianNameSchema.safeParse('Juan123').success).toBe(false)
  })

  it('rejects XSS payloads', () => {
    expect(colombianNameSchema.safeParse('<script>alert(1)</script>').success).toBe(false)
    expect(colombianNameSchema.safeParse('<img src=x onerror=alert(1)>').success).toBe(false)
    expect(colombianNameSchema.safeParse('<svg onload=alert(1)>').success).toBe(false)
  })

  it('rejects names shorter than 2 characters', () => {
    expect(colombianNameSchema.safeParse('A').success).toBe(false)
  })

  it('trims whitespace', () => {
    const result = colombianNameSchema.safeParse('  Ana  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('Ana')
    }
  })
})

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('test@mail.com').success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
    expect(emailSchema.safeParse('@domain.com').success).toBe(false)
  })

  it('normalizes email: trims and lowercases', () => {
    const result = emailSchema.safeParse('  TEST@MAIL.COM  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test@mail.com')
    }
  })

  it('normalizes email with mixed case', () => {
    const result = emailSchema.safeParse('User@Example.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('user@example.com')
    }
  })
})

describe('passwordSchema', () => {
  it('accepts strong password', () => {
    expect(passwordSchema.safeParse('Abcdef1!').success).toBe(true)
  })

  it('rejects short password (< 8 chars)', () => {
    const result = passwordSchema.safeParse('Ab1!')
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    expect(passwordSchema.safeParse('abcdef1!').success).toBe(false)
  })

  it('rejects password without lowercase', () => {
    expect(passwordSchema.safeParse('ABCDEF1!').success).toBe(false)
  })

  it('rejects password without number', () => {
    expect(passwordSchema.safeParse('Abcdefgh!').success).toBe(false)
  })

  it('rejects password without special char', () => {
    expect(passwordSchema.safeParse('Abcdefgh1').success).toBe(false)
  })
})

describe('sanitizeText', () => {
  it('escapes < and >', () => {
    expect(sanitizeText('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes quotes', () => {
    expect(sanitizeText('test"quote\'')).toBe('test&quot;quote&#x27;')
  })

  it('passes safe text unchanged', () => {
    expect(sanitizeText('Hola mundo')).toBe('Hola mundo')
  })

  it('escapes combined XSS payload', () => {
    const input = '<img src=x onerror=alert(1)>'
    const output = sanitizeText(input)
    expect(output).not.toContain('<img')
    expect(output).toContain('&lt;img')
  })

  it('escapes svg onload payload', () => {
    const input = '<svg onload=alert(1)>'
    const output = sanitizeText(input)
    expect(output).not.toContain('<svg')
    expect(output).toContain('&lt;svg')
  })
})

describe('timeToMinutes', () => {
  it('converts "09:00" to 540', () => {
    expect(timeToMinutes('09:00')).toBe(540)
  })

  it('converts "20:00" to 1200', () => {
    expect(timeToMinutes('20:00')).toBe(1200)
  })

  it('converts "00:00" to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0)
  })

  it('converts "23:59" to 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('handles opening < closing comparison', () => {
    expect(timeToMinutes('09:00')).toBeLessThan(timeToMinutes('20:00'))
  })

  it('handles closing > opening comparison', () => {
    expect(timeToMinutes('20:00')).toBeGreaterThan(timeToMinutes('09:00'))
  })
})
