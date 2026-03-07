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
