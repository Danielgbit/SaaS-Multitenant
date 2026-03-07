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
