import type { Database } from '@/../types/supabase'

export type Employee = Database['public']['Tables']['employees']['Row']

export type CreateEmployeeInput = {
  name: string
  phone?: string | null
}

export type UpdateEmployeeInput = {
  id: string
  name: string
  phone?: string | null
}

// === PAYROLL v2 TYPES ===

export type ContractType = 'laboral' | 'prestacion'
export type PaymentType = 'fijo' | 'porcentaje' | 'mixed'
export type SalaryFrequency = 'weekly' | 'biweekly' | 'monthly'
export type PeriodStatus = 'draft' | 'approved' | 'paid'

export type UpdateEmployeePayrollInput = {
  id: string
  default_commission_rate?: number
  payment_type?: PaymentType
  contract_type?: ContractType
  base_salary?: number | null
  has_transport_subsidy?: boolean
  force_transport_subsidy?: boolean
  salary_frequency?: SalaryFrequency | null
  max_debt_limit?: number
  debt_warning_threshold?: number
}

export type EmployeeWithPayrollConfig = Employee & {
  default_commission_rate: number
  payment_type: PaymentType
  contract_type: ContractType
  base_salary: number | null
  has_transport_subsidy: boolean
  force_transport_subsidy: boolean
  salary_frequency: SalaryFrequency | null
  max_debt_limit: number
  debt_warning_threshold: number
}

// Legacy aliases for backwards compatibility during transition
export type LegacyPaymentType = 'commission' | 'salary' | 'mixed'
export const LEGACY_TO_NEW_PAYMENT_TYPE: Record<LegacyPaymentType, PaymentType> = {
  commission: 'porcentaje',
  salary: 'fijo',
  mixed: 'mixed'
}

export const NEW_TO_LEGACY_PAYMENT_TYPE: Record<PaymentType, LegacyPaymentType> = {
  fijo: 'salary',
  porcentaje: 'commission',
  mixed: 'mixed'
}