import { describe, it, expect } from 'vitest'
import {
  MarkCompletedSchema,
  ConfirmServiceSchema,
  AdjustPriceSchema,
  MarkManuallySchema,
  CancelConfirmationSchema,
  GetNotificationsSchema,
  PaymentMethodSchema,
} from '../schemas'

describe('PaymentMethodSchema', () => {
  it('accepts valid payment methods', () => {
    const valid = ['efectivo', 'nequi', 'daviplata', 'pse', 'qr_nequi', 'qr_bancolombia', 'tarjeta_debito', 'tarjeta_credito']
    valid.forEach(m => expect(PaymentMethodSchema.safeParse(m).success).toBe(true))
  })

  it('rejects invalid payment method', () => {
    expect(PaymentMethodSchema.safeParse('bitcoin').success).toBe(false)
    expect(PaymentMethodSchema.safeParse('').success).toBe(false)
    expect(PaymentMethodSchema.safeParse(123).success).toBe(false)
  })
})

describe('MarkCompletedSchema', () => {
  it('accepts valid input with only appointmentId', () => {
    const result = MarkCompletedSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priceAdjustment).toBe(0)
    }
  })

  it('accepts valid input with price adjustment', () => {
    const result = MarkCompletedSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      priceAdjustment: 10000,
      notes: 'Decoración extra',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUID', () => {
    const result = MarkCompletedSchema.safeParse({
      appointmentId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price adjustment', () => {
    const result = MarkCompletedSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      priceAdjustment: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects notes exceeding 500 chars', () => {
    const result = MarkCompletedSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('ConfirmServiceSchema', () => {
  it('accepts valid input', () => {
    const result = ConfirmServiceSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      paymentMethod: 'nequi',
    })
    expect(result.success).toBe(true)
  })

  it('accepts input with optional logId and notes', () => {
    const result = ConfirmServiceSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      logId: '550e8400-e29b-41d4-a716-446655440001',
      paymentMethod: 'efectivo',
      notes: 'Pago completo',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid payment method', () => {
    const result = ConfirmServiceSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      paymentMethod: 'tarjeta',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing appointmentId', () => {
    const result = ConfirmServiceSchema.safeParse({
      paymentMethod: 'efectivo',
    })
    expect(result.success).toBe(false)
  })
})

describe('AdjustPriceSchema', () => {
  it('accepts valid input', () => {
    const result = AdjustPriceSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      newPrice: 50000,
      reason: 'Ajuste por promoción',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing reason', () => {
    const result = AdjustPriceSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      newPrice: 50000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = AdjustPriceSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      newPrice: -1000,
      reason: 'Descuento',
    })
    expect(result.success).toBe(false)
  })
})

describe('MarkManuallySchema', () => {
  it('accepts valid input', () => {
    const result = MarkManuallySchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Cliente no fue marcado por empleado',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty reason', () => {
    const result = MarkManuallySchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      reason: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('CancelConfirmationSchema', () => {
  it('accepts valid input', () => {
    const result = CancelConfirmationSchema.safeParse({
      appointmentId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Cliente canceló',
    })
    expect(result.success).toBe(true)
  })
})

describe('GetNotificationsSchema', () => {
  it('accepts valid input with defaults', () => {
    const result = GetNotificationsSchema.safeParse({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.unreadOnly).toBe(false)
      expect(result.data.limit).toBe(50)
    }
  })

  it('accepts explicit unreadOnly and limit', () => {
    const result = GetNotificationsSchema.safeParse({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      unreadOnly: true,
      limit: 10,
    })
    expect(result.success).toBe(true)
  })
})
