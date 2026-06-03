import { describe, it, expect } from 'vitest'
import { CreateServiceSchema, UpdateServiceSchema } from '@/schemas/services/service.schema'

describe('CreateServiceSchema', () => {
  it('accepts valid input', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Corte de cabello',
      duration: 30,
      price: 50000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = CreateServiceSchema.safeParse({ name: '', duration: 30, price: 50000 })
    expect(result.success).toBe(false)
  })

  it('rejects duration < 5', () => {
    const result = CreateServiceSchema.safeParse({ name: 'Corte', duration: 2, price: 50000 })
    expect(result.success).toBe(false)
  })

  it('rejects duration > 480 (8 hours)', () => {
    const result = CreateServiceSchema.safeParse({ name: 'Corte', duration: 500, price: 50000 })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = CreateServiceSchema.safeParse({ name: 'Corte', duration: 30, price: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects NaN duration', () => {
    const result = CreateServiceSchema.safeParse({ name: 'Corte', duration: NaN, price: 50000 })
    expect(result.success).toBe(false)
  })

  it('rejects Infinity price', () => {
    const result = CreateServiceSchema.safeParse({ name: 'Corte', duration: 30, price: Infinity })
    expect(result.success).toBe(false)
  })

  it('rejects XSS in name', () => {
    const result = CreateServiceSchema.safeParse({
      name: '<script>alert(1)</script>',
      duration: 30,
      price: 50000,
    })
    expect(result.success).toBe(false)
  })

  it('trims name whitespace', () => {
    const result = CreateServiceSchema.safeParse({
      name: '  Corte  ',
      duration: 30,
      price: 50000,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Corte')
    }
  })
})

describe('UpdateServiceSchema', () => {
  it('accepts valid update with id', () => {
    const result = UpdateServiceSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Corte actualizado',
      duration: 45,
      price: 60000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid uuid', () => {
    const result = UpdateServiceSchema.safeParse({
      id: 'not-a-uuid',
      name: 'Corte',
      duration: 30,
      price: 50000,
    })
    expect(result.success).toBe(false)
  })
})
