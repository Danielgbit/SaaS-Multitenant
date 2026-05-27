type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface EmployeeMetrics {
  completedThisMonth: number
  revenueThisMonth: number
  completionRate: number
  streak: number
  noShowRate: number
  pendingLoans: number
  cancelledThisMonth: number
}

export interface ServiceHistory {
  id: string
  date: string
  clientName: string
  serviceName: string
  servicePrice: number
  status: AppointmentStatus
  appointmentId: string
}

export interface UpcomingAppointment {
  id: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  clientName: string | null
}
