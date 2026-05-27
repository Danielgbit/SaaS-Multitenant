import { describe, it, expect } from 'vitest'

type PaymentType = 'fijo' | 'porcentaje' | 'mixed'

function calculateCommission(
  paymentType: PaymentType,
  servicePrice: number,
  percentage: number,
  baseSalary: number | null,
): number {
  if (paymentType === 'fijo') return 0

  const rate = percentage / 100
  const commission = servicePrice * rate

  if (paymentType === 'porcentaje') return commission
  if (paymentType === 'mixed') return commission

  return 0
}

function totalPay(
  paymentType: PaymentType,
  servicePrice: number,
  percentage: number,
  baseSalary: number | null,
  periodDays: number,
): { commission: number; total: number } {
  const commission = calculateCommission(paymentType, servicePrice, percentage, baseSalary)
  let salary = 0

  if (paymentType === 'fijo' && baseSalary) {
    salary = baseSalary / periodDays
  }
  if (paymentType === 'mixed' && baseSalary) {
    salary = baseSalary / periodDays
  }

  return { commission, total: commission + salary }
}

describe('calculateCommission', () => {
  it('porcentaje: 20% of 50000 = 10000', () => {
    expect(calculateCommission('porcentaje', 50000, 20, null)).toBe(10000)
  })

  it('porcentaje: 10% of 75000 = 7500', () => {
    expect(calculateCommission('porcentaje', 75000, 10, null)).toBe(7500)
  })

  it('porcentaje: 0% = 0', () => {
    expect(calculateCommission('porcentaje', 50000, 0, null)).toBe(0)
  })

  it('fijo: no commission regardless of price', () => {
    expect(calculateCommission('fijo', 100000, 20, 1000000)).toBe(0)
    expect(calculateCommission('fijo', 0, 0, null)).toBe(0)
  })

  it('mixed: returns commission only (salary separate)', () => {
    expect(calculateCommission('mixed', 50000, 10, 1000000)).toBe(5000)
  })

  it('mixed: 0% commission = 0', () => {
    expect(calculateCommission('mixed', 50000, 0, 1000000)).toBe(0)
  })
})

describe('totalPay', () => {
  it('porcentaje: total = commission only', () => {
    const result = totalPay('porcentaje', 50000, 20, null, 30)
    expect(result.commission).toBe(10000)
    expect(result.total).toBe(10000)
  })

  it('fijo: total = daily salary, no commission', () => {
    const result = totalPay('fijo', 50000, 20, 1000000, 30)
    expect(result.commission).toBe(0)
    expect(result.total).toBe(1000000 / 30)
  })

  it('mixed: total = commission + daily salary', () => {
    const result = totalPay('mixed', 50000, 10, 1000000, 30)
    expect(result.commission).toBe(5000)
    expect(result.total).toBe(5000 + 1000000 / 30)
  })

  it('fijo with null salary: total = 0', () => {
    const result = totalPay('fijo', 50000, 0, null, 30)
    expect(result.commission).toBe(0)
    expect(result.total).toBe(0)
  })
})
