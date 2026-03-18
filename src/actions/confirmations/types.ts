'use server'

export interface ConfirmationService {
  service_id: string
  service_name: string
  price: number
  performed: boolean
}

export interface AppointmentConfirmation {
  id: string
  appointment_id: string | null
  organization_id: string
  employee_id: string
  services: ConfirmationService[]
  total_amount: number
  confirmation_type: 'scheduled' | 'walkin'
  status: 'pending_employee' | 'pending_reception' | 'completed' | 'no_show' | 'not_performed'
  employee_confirmed_at: string | null
  reception_confirmed_at: string | null
  payment_method: string | null
  client_name: string | null
  client_phone: string | null
  notes: string | null
  created_at: string
}

export interface CreateConfirmationInput {
  organization_id: string
  employee_id: string
  appointment_id?: string
  services: ConfirmationService[]
  confirmation_type: 'scheduled' | 'walkin'
  client_name?: string
  client_phone?: string
  notes?: string
}
