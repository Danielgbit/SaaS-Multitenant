export interface Appointment {
  id: string
  organization_id: string
  client_id: string
  employee_id: string
  service_id?: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  created_at: string
}

export interface Employee {
  id: string
  organization_id: string
  name: string
  phone: string | null
  active: boolean
  created_at: string
}

export interface Client {
  id: string
  organization_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export interface Service {
  id: string
  organization_id: string
  name: string
  duration: number
  price: number
  active: boolean
  created_at: string
}

export interface AppointmentWithDetails extends Appointment {
  client?: Client
  employee?: Employee
  service?: Service
  confirmation_status?: string
  completed_at?: string | null
  confirmed_at?: string | null
  price_adjustment?: number
  payment_method?: string | null
}

export interface CalendarViewProps {
  organizationId: string
  userRole?: string
}

export interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
}

export interface NewAppointmentData {
  clientId: string
  serviceId: string
  employeeId: string
  date: string
  time: string
  notes: string
}

export interface EditAppointmentData {
  clientId: string
  serviceId: string
  employeeId: string
  date: string
  time: string
  notes: string
}

export interface CalendarColors {
  primary: string
  primaryLight: string
  surface: string
  surfaceSubtle: string
  surfaceHover: string
  border: string
  borderLight: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  successLight: string
  warning: string
  warningLight: string
  error: string
  errorLight: string
  overlay: string
  glass: string
  isDark: boolean
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'

export interface StatusConfig {
  color: string
  bg: string
  label: string
}
