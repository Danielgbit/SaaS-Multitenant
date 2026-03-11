import { createClient } from '@/lib/supabase/server'
import type { EmployeeAvailability } from '@/types/availability'
import type { Service } from '@/types/services'

// =============================================================================
// TIPOS
// =============================================================================

export interface TimeSlot {
  start_time: string // ISO string
  end_time: string   // ISO string
  available: boolean
}

export interface GenerateSlotsParams {
  employeeId: string
  serviceId: string
  date: string // YYYY-MM-DD
  organizationId: string
}

export interface BookingSettings {
  slot_interval: number      // minutos entre slots (default 30)
  buffer_minutes: number     // tiempo de缓冲 entre citas
  max_days_ahead: number     // días máxima anticipación
  min_notice_hours: number  // horas mínimas de anticipación
  timezone: string
  online_booking_enabled: boolean
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convierte TIME (HH:MM) a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte minutos desde medianoche a TIME (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Convierte fecha + hora a ISO string
 */
function toISOString(date: string, time: string): string {
  return `${date}T${time}:00.000Z`
}

/**
 * Verifica si dos rangos de tiempo se superponen
 */
function rangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2
}

// =============================================================================
// SERVICIOS DE CONSULTA
// =============================================================================

/**
 * Obtiene la disponibilidad de un empleado para un día específico
 */
async function getEmployeeAvailabilityForDay(
  employeeId: string,
  dayOfWeek: number
): Promise<EmployeeAvailability | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_availability')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  if (error) {
    console.error('Error fetching availability:', error.message)
    throw new Error('Error al obtener disponibilidad')
  }

  return data
}

/**
 * Obtiene la duración de un servicio
 */
async function getServiceDuration(serviceId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('duration')
    .eq('id', serviceId)
    .maybeSingle()

  if (error || !data) {
    console.error('Error fetching service:', error?.message)
    throw new Error('Servicio no encontrado')
  }

  return data.duration
}

/**
 * Obtiene las citas de un empleado para una fecha específica
 */
async function getAppointmentsForDate(
  employeeId: string,
  date: string
): Promise<{ start: number; end: number }[]> {
  const supabase = await createClient()

  // Rango del día completo
  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('employee_id', employeeId)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .in('status', ['pending', 'confirmed']) // Solo citas activas

  if (error) {
    console.error('Error fetching appointments:', error.message)
    return []
  }

  // Convertir a minutos desde medianoche
  return (data ?? []).map((apt) => ({
    start: timeToMinutes(apt.start_time.split('T')[1].slice(0, 5)),
    end: timeToMinutes(apt.end_time.split('T')[1].slice(0, 5)),
  }))
}

/**
 * Obtiene la configuración de booking de la organización
 */
async function getBookingSettings(
  organizationId: string
): Promise<BookingSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('booking_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  // Valores por defecto si no existe
  return {
    slot_interval: data?.slot_interval ?? 30,
    buffer_minutes: data?.buffer_minutes ?? 0,
    max_days_ahead: data?.max_days_ahead ?? 60,
    min_notice_hours: data?.min_notice_hours ?? 24,
    timezone: data?.timezone ?? 'UTC',
    online_booking_enabled: data?.online_booking_enabled ?? true,
  }
}

// =============================================================================
// GENERADOR DE SLOTS
// =============================================================================

/**
 * Genera los slots disponibles para un empleado, servicio y fecha específicos.
 * 
 * @param params.employeeId - ID del empleado
 * @param params.serviceId - ID del servicio
 * @param params.date - Fecha en formato YYYY-MM-DD
 * @param params.organizationId - ID de la organización
 * @returns Array de TimeSlot con disponibilidad
 */
export async function generateSlots({
  employeeId,
  serviceId,
  date,
  organizationId,
}: GenerateSlotsParams): Promise<TimeSlot[]> {
  // 1. Obtener day of week (0 = domingo, 6 = sábado)
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay()

  // 2. Obtener disponibilidad del empleado para ese día
  const availability = await getEmployeeAvailabilityForDay(employeeId, dayOfWeek)

  if (!availability) {
    // No hay disponibilidad configurada para este día
    return []
  }

  // 3. Obtener duración del servicio
  const serviceDuration = await getServiceDuration(serviceId)

  // 4. Obtener configuración de booking
  const settings = await getBookingSettings(organizationId)

  // 5. Obtener citas existentes para ese día
  const bookedSlots = await getAppointmentsForDate(employeeId, date)

  // 6. Generar slots
  const slots: TimeSlot[] = []

  const startMinutes = timeToMinutes(availability.start_time)
  const endMinutes = timeToMinutes(availability.end_time)
  const slotInterval = settings.slot_interval
  const buffer = settings.buffer_minutes

  // Calcular hora mínima de reserva (ahora + min_notice_hours)
  const minBookingTime = Date.now() + settings.min_notice_hours * 60 * 60 * 1000

  // Generar slots cada slot_interval minutos
  for (let time = startMinutes; time + serviceDuration <= endMinutes; time += slotInterval) {
    const slotStart = time
    const slotEnd = time + serviceDuration + buffer // Incluir buffer

    // Verificar si el slot está en el pasado
    const slotDateTime = new Date(`${date}T${minutesToTime(time)}:00.000Z`)
    const isPast = slotDateTime.getTime() < minBookingTime

    // Verificar si el slot colisiona con citas existentes
    const isBooked = bookedSlots.some((booked) =>
      rangesOverlap(slotStart, slotEnd - buffer, booked.start, booked.end)
    )

    // Solo agregar si no está reservado y no está en el pasado
    if (!isBooked && !isPast) {
      slots.push({
        start_time: toISOString(date, minutesToTime(time)),
        end_time: toISOString(date, minutesToTime(slotEnd - buffer)),
        available: true,
      })
    } else if (isBooked) {
      // También mostrar slots ocupados (para el calendario)
      slots.push({
        start_time: toISOString(date, minutesToTime(time)),
        end_time: toISOString(date, minutesToTime(slotEnd - buffer)),
        available: false,
      })
    }
  }

  return slots
}

/**
 * Genera slots para múltiples empleados (útil para vista de calendario)
 */
export async function generateSlotsForMultipleEmployees({
  employeeIds,
  serviceId,
  date,
  organizationId,
}: {
  employeeIds: string[]
  serviceId: string
  date: string
  organizationId: string
}): Promise<Record<string, TimeSlot[]>> {
  const results: Record<string, TimeSlot[]> = {}

  await Promise.all(
    employeeIds.map(async (employeeId) => {
      results[employeeId] = await generateSlots({
        employeeId,
        serviceId,
        date,
        organizationId,
      })
    })
  )

  return results
}
