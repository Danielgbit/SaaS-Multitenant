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

export type { TimeSlot } from '@/types/slots'

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

// NOTE: CalendarColors extends ThemeColors with calendar-specific tokens (surfaceHover, glass)
// This interface should stay in sync with ThemeColors from @/hooks/useThemeColors
export interface CalendarColors {
  primary: string
  primaryLight: string
  primaryGradient: string
  primarySubtle: string
  surface: string
  surfaceSubtle: string
  surfaceGlass: string
  surfaceGlassStrong?: string
  surfaceHover: string
  border: string
  borderLight?: string
  borderFocus: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  successLight?: string
  warning: string
  warningLight?: string
  error: string
  errorLight?: string
  danger: string
  dangerLight: string
  amber: string
  amberLight: string
  gold: string
  goldLight: string
  info: string
  infoLight?: string
  overlay?: string
  glass: string
  radius: { sm: string; md: string; lg: string; xl: string }
  shadow: { sm: string; md: string; lg: string; xl: string }
  shadowInput: string
  transition: string
  headerBg: string
  headerText: string
  headerTextMuted: string
  whatsapp: string
  whatsappLight: string
  isDark: boolean
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'

export interface StatusConfig {
  color: string
  bg: string
  label: string
}

// Employee Filter Types
export type EmployeeFilter = 'all' | string

export type WorkloadLevel = 'low' | 'normal' | 'busy' | 'overloaded'

export interface EmployeeWorkload {
  employeeId: string
  weeklyCount: number
  maxPerDay: number
  workloadLevel: WorkloadLevel
}

export interface CalendarFilterState {
  selectedEmployeeId: EmployeeFilter
  employeeWorkloads: Record<string, EmployeeWorkload>
  isLoading: boolean
}

export interface EmployeeWithWorkload extends Employee {
  weeklyCount: number
  maxPerDay: number
  workloadLevel: WorkloadLevel
  dailyBreakdown: Record<string, number>
  hasConfiguredSchedule: boolean
}

// Employee Selector Types
export interface EmployeeChipProps {
  employee: EmployeeWithWorkload
  isSelected: boolean
  onClick: () => void
  variant: 'full' | 'compact'
  COLORS: CalendarColors
}

export interface EmployeeSelectorBarProps {
  employees: EmployeeWithWorkload[]
  selectedEmployeeId: EmployeeFilter
  onSelect: (employeeId: EmployeeFilter) => void
  totalAppointments: number
  COLORS: CalendarColors
  visibleCount?: number
}

export interface OverflowDropdownProps {
  employees: EmployeeWithWorkload[]
  selectedEmployeeId: EmployeeFilter
  onSelect: (employeeId: EmployeeFilter) => void
  COLORS: CalendarColors
}
