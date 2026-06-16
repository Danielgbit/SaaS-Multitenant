import { describe, it, expect } from 'vitest'
import { normalizePhoneToE164 } from '../phone'

describe('normalizePhoneToE164', () => {
  it('adds +57 to Colombian 10-digit number', () => {
    expect(normalizePhoneToE164('3001234567', 'CO')).toBe('+573001234567')
  })

  it('keeps +57 prefix if already present', () => {
    expect(normalizePhoneToE164('+573001234567', 'CO')).toBe('+573001234567')
  })

  it('adds + to 57-prefixed without plus', () => {
    expect(normalizePhoneToE164('573001234567', 'CO')).toBe('+573001234567')
  })

  it('strips spaces and special chars', () => {
    expect(normalizePhoneToE164('300 123 4567', 'CO')).toBe('+573001234567')
    expect(normalizePhoneToE164('300-123-4567', 'CO')).toBe('+573001234567')
    expect(normalizePhoneToE164('(300) 123-4567', 'CO')).toBe('+573001234567')
  })

  it('returns null for empty or whitespace input', () => {
    expect(normalizePhoneToE164('', 'CO')).toBeNull()
    expect(normalizePhoneToE164('   ', 'CO')).toBeNull()
  })

  it('handles US numbers', () => {
    expect(normalizePhoneToE164('2345678900', 'US')).toBe('+12345678900')
    expect(normalizePhoneToE164('+12345678900', 'US')).toBe('+12345678900')
    expect(normalizePhoneToE164('(234) 567-8900', 'US')).toBe('+12345678900')
  })

  it('defaults to CO country', () => {
    expect(normalizePhoneToE164('3001234567')).toBe('+573001234567')
  })
})
