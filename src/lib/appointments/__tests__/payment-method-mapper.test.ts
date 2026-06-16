import { describe, it, expect } from 'vitest'
import { mapPaymentMethod } from '../payment-method-mapper'

describe('mapPaymentMethod', () => {
  it('mapea efectivo → cash', () => {
    expect(mapPaymentMethod('efectivo')).toBe('cash')
  })

  it('mapea nequi → qr', () => {
    expect(mapPaymentMethod('nequi')).toBe('qr')
  })

  it('mapea daviplata → qr', () => {
    expect(mapPaymentMethod('daviplata')).toBe('qr')
  })

  it('mapea pse → transfer', () => {
    expect(mapPaymentMethod('pse')).toBe('transfer')
  })

  it('mapea qr_nequi → qr', () => {
    expect(mapPaymentMethod('qr_nequi')).toBe('qr')
  })

  it('mapea qr_bancolombia → qr', () => {
    expect(mapPaymentMethod('qr_bancolombia')).toBe('qr')
  })

  it('mapea tarjeta_debito → card', () => {
    expect(mapPaymentMethod('tarjeta_debito')).toBe('card')
  })

  it('mapea tarjeta_credito → card', () => {
    expect(mapPaymentMethod('tarjeta_credito')).toBe('card')
  })

  it('mapea null → cash', () => {
    expect(mapPaymentMethod(null)).toBe('cash')
  })

  it('mapea undefined → cash', () => {
    expect(mapPaymentMethod(undefined)).toBe('cash')
  })

  it('mapea código inválido → cash', () => {
    expect(mapPaymentMethod('codigo_invalido')).toBe('cash')
  })

  it('mapea string vacío → cash', () => {
    expect(mapPaymentMethod('')).toBe('cash')
  })
})
