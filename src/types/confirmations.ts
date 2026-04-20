// =========================================================================================
// TYPES: Sistema de Confirmaciones - Auditoría y Notificaciones
// =========================================================================================

export type ConfirmationStatus = 
  | 'scheduled' 
  | 'completed' 
  | 'confirmed' 
  | 'needs_review'

export type ConfirmationAction = 
  | 'created' 
  | 'confirmed' 
  | 'adjusted' 
  | 'manually_set' 
  | 'cancelled'

export type PerformedByRole = 'employee' | 'assistant' | 'system'

export type NotificationType = 
  | 'reminder' 
  | 'service_ready' 
  | 'unmarked_alert' 
  | 'auto_completed' 
  | 'confirmation_sent'

export type PaymentMethodCode = 
  | 'efectivo' 
  | 'nequi' 
  | 'daviplata' 
  | 'pse' 
  | 'qr_nequi' 
  | 'qr_bancolombia' 
  | 'tarjeta_debito' 
  | 'tarjeta_credito'

export interface ConfirmationLog {
  id: string
  appointment_id: string | null
  organization_id: string
  action: ConfirmationAction
  performed_by: string | null
  performed_by_role: PerformedByRole
  price_before: number | null
  price_after: number | null
  payment_method: PaymentMethodCode | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface ConfirmationPending {
  id: string
  appointment_id: string | null
  organization_id: string
  employee_id: string
  employee_name?: string
  services: ConfirmationService[]
  total_amount: number
  adjusted_price?: number | null
  confirmation_type: 'scheduled' | 'walkin'
  confirmation_status: 'pending_employee' | 'pending_reception' | 'completed' | 'no_show' | 'not_performed'
  client_name: string | null
  client_phone: string | null
  notes: string | null
  reception_notes?: string | null
  employee_confirmed_at: string | null
  reception_confirmed_at: string | null
  payment_method: PaymentMethodCode | null
  created_at: string
  
  // Joined fields
  appointment_start_time?: string
  appointment_end_time?: string
  appointment_confirmation_status?: ConfirmationStatus
}

export interface ConfirmationService {
  service_id: string
  service_name: string
  price: number
  performed: boolean
}

export interface AppointmentWithConfirmationStatus {
  id: string
  organization_id: string
  client_id: string
  employee_id: string
  service_id?: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  confirmation_status: ConfirmationStatus
  completed_at: string | null
  completed_by: string | null
  confirmed_at: string | null
  confirmed_by: string | null
  price_adjustment: number
  payment_method: PaymentMethodCode | null
  created_at: string
}

export interface PendingConfirmationWithDetails {
  id: string
  appointment_id: string | null
  organization_id: string
  employee_id: string
  employee_name?: string
  services: ConfirmationService[]
  total_amount: number
  adjusted_price?: number | null
  confirmation_type: 'scheduled' | 'walkin'
  confirmation_status: ConfirmationStatus | 'needs_review'
  client_name: string | null
  client_phone: string | null
  notes: string | null
  reception_notes?: string | null
  employee_confirmed_at: string | null
  reception_confirmed_at: string | null
  payment_method: PaymentMethodCode | null
  created_at: string
  completed_at?: string | null
  start_time?: string
  end_time?: string
  price_adjustment?: number
  clients?: {
    name: string
    phone: string | null
  }
  appointment?: {
    id: string
    start_time: string
    end_time: string
    client?: {
      name: string
      phone: string | null
    }
  }
  employee?: {
    name: string
  }
}

export interface UnreadNotificationCount {
  user_id: string
  unread_count: number
}
