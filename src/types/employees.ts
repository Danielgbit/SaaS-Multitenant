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

// === NUEVOS TIPOS PARA NÓMINA ===

export type PaymentType = 'commission' | 'salary' | 'mixed'
export type SalaryFrequency = 'weekly' | 'biweekly' | 'monthly'

export type UpdateEmployeePayrollInput = {
  id: string
  default_commission_rate?: number
  payment_type?: PaymentType
  fixed_salary?: number | null
  salary_frequency?: SalaryFrequency | null
  max_debt_limit?: number
  debt_warning_threshold?: number
}

export type EmployeeWithPayrollConfig = Employee & {
  default_commission_rate: number
  payment_type: PaymentType
  fixed_salary: number | null
  salary_frequency: SalaryFrequency | null
  max_debt_limit: number
  debt_warning_threshold: number
}
