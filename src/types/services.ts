import type { Database } from '@/../types/supabase'

export type Service = Database['public']['Tables']['services']['Row']

export type CreateServiceInput = {
  name: string
  duration: number
  price: number
}

export type UpdateServiceInput = {
  id: string
  name: string
  duration: number
  price: number
}

// === NUEVOS TIPOS PARA NÓMINA ===

export type UpdateServiceCommissionInput = {
  id: string
  has_commission?: boolean
}

export type EmployeeService = Database['public']['Tables']['employee_services']['Row']

export type UpdateEmployeeServiceInput = {
  employee_id: string
  service_id: string
  duration_override?: number | null
  price_override?: number | null
  commission_rate?: number | null
}
