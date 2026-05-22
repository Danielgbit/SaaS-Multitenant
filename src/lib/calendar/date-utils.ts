import type { AppointmentWithDetails } from '@/types/calendar'

export function getMonday(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(start.setDate(diff))
}

export function getWeekDates(date: Date): Date[] {
  const monday = getMonday(new Date(date))
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDateTimeFull(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export function isToday(date: Date): boolean {
  return formatDateKey(date) === formatDateKey(new Date())
}

export function getWeekRange(dates: Date[]): string {
  if (dates.length === 0) return ''
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const first = dates[0].toLocaleDateString('es-ES', options)
  const last = dates[dates.length - 1].toLocaleDateString('es-ES', options)
  return `${first} - ${last}`
}

export function groupAppointmentsByDay(
  appointments: AppointmentWithDetails[],
  weekDates: Date[]
): Record<string, AppointmentWithDetails[]> {
  const grouped: Record<string, AppointmentWithDetails[]> = {}
  weekDates.forEach(d => {
    grouped[formatDateKey(d)] = []
  })
  appointments.forEach(apt => {
    const key = formatDateKey(new Date(apt.start_time))
    if (grouped[key]) {
      grouped[key].push(apt)
    }
  })
  return grouped
}
