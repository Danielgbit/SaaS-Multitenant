import { createClient } from '@/lib/supabase/server'
import type { EmployeeAvailability } from '@/types/availability'
import type { Service } from '@/types/services'
import { getSpaOverrideForDate } from '@/services/availability/getSpaOverrides'

// =============================================================================
// TIPOS
// =============================================================================

export interface TimeSlot {
  start_time: string // ISO string
  end_time: string   // ISO string
  available: boolean
  blockedReason?: string // Razón por la que está bloqueado
}

export interface GenerateSlotsParams {
  employeeId: string
  serviceId: string
  date: string // YYYY-MM-DD
  organizationId: string
  bypassNotice?: boolean // If true, ignores min_notice_hours (for admin/owner)
  bypassAvailability?: boolean // If true, ignores employee availability (for force creation)
}

export interface BookingSettings {
  slot_interval: number      // minutos entre slots (default 30)
  buffer_minutes: number     // tiempo de buffer entre citas
  max_days_ahead: number     // días máxima anticipación
  min_notice_hours: number  // horas mínimas de anticipación
  timezone: string
  online_booking_enabled: boolean
  spa_opening_time: string   // hora de apertura del spa (ej: "09:00")
  spa_closing_time: string   // hora de cierre del spa (ej: "20:00")
}

export interface EmployeeAvailabilityOverride {
  id: string
  employee_id: string
  date: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean
  reason: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// =============================================================================
// HELPERS DE ZONA HORARIA
// =============================================================================

/**
 * Obtiene el offset en minutos de una zona horaria IANA (ej: "America/Bogota")
 * Retorna el offset de la zona horaria respecto a UTC
 * Ej: America/Bogota (UTC-5) retorna -300 (porque está 5 horas detrás de UTC)
 */
function getTimezoneOffset(timezone: string): number {
  try {
    // Use a fixed date to calculate the offset reliably
    // January 1, 2026 at noon UTC - a date we know exists
    const referenceDate = new Date('2026-01-01T12:00:00Z')
    
    // Get the offset by comparing how the same instant appears in different timezones
    // Create a formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    })
    
    // Format the same UTC instant in the target timezone
    const localTimeString = formatter.format(referenceDate)
    
    // Parse it back treating it as if it were in the target timezone
    // We need to create a date that represents "same wall clock time" in that timezone
    // Then compare with UTC
    const [month, day, year, hour, minute, second] = localTimeString.match(/\d+/g)!.map(Number)
    
    // Create a date assuming the parsed values are in the target timezone
    // Then get its UTC equivalent
    const localDateInTargetTz = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    
    // The difference is the offset from UTC
    // If local time is behind UTC (like Colombia), offset is negative
    const offsetMs = localDateInTargetTz.getTime() - referenceDate.getTime()
    const offsetMinutes = offsetMs / (1000 * 60)
    
    return offsetMinutes
  } catch {
    console.warn(`Invalid timezone: ${timezone}, using UTC (0)`)
    return 0
  }
}

/**
 * Convierte TIME (HH:MM) en minutos desde medianoche en UTC
 * El TIME almacenado en DB es hora LOCAL del spa, no UTC
 * Necesitamos convertirlo a UTC para consistencia
 * Handles times that cross midnight in UTC (e.g., 19:59 Colombia = 23:59 UTC same day)
 */
function timeToMinutesUTC(time: string, timezone: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const localMinutes = hours * 60 + minutes
  const offset = getTimezoneOffset(timezone)
  // Convertir hora local a UTC restando el offset
  // Negative offset means local is behind UTC (e.g., UTC-5 for Colombia)
  let utcMinutes = localMinutes - offset

  // Normalize to 0-1439 range to handle times that cross midnight
  // If employee works 19:00-23:59 local in UTC-5, that's 24:00-04:59 UTC
  // 19:00 = 1140 min local, -(-300) = 1440 = 24*60 = midnight next day UTC
  // We want this to be treated as 0-299 UTC (00:00-04:59)
  while (utcMinutes < 0) {
    utcMinutes += 1440
  }
  while (utcMinutes >= 1440) {
    utcMinutes -= 1440
  }

  return utcMinutes
}

/**
 * Convierte minutos desde medianoche UTC a TIME (HH:MM) local
 * Handles UTC times that represent times on the previous day in local time
 */
function minutesToTimeLocal(minutes: number, timezone: string): string {
  const offset = getTimezoneOffset(timezone)
  // Convertir UTC a local sumando el offset
  let localMinutes = minutes + offset

  // Normalize to 0-1439 range
  while (localMinutes < 0) {
    localMinutes += 1440
  }
  while (localMinutes >= 1440) {
    localMinutes -= 1440
  }

  const h = Math.floor(localMinutes / 60) % 24
  const m = localMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// =============================================================================
// TIPOS PARA RANGOS CON FECHA
// =============================================================================

/**
 * Representa una hora con información de fecha para manejar crossing midnight
 * minutesFromMidnight: minutos desde medianoche local (0-1439)
 * dayOffset: 0 = mismo día que la fecha de la cita, 1 = día siguiente
 */
interface TimeWithDay {
  minutesFromMidnight: number
  dayOffset: number // 0 = same day, 1 = next day, -1 = previous day
}

/**
 * Convierte TIME string a minutos desde medianoche local
 * NO convierte a UTC - usa el valor directamente como hora local
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte TIME (HH:MM) a minutos UTC con información de día
 * El TIME almacenado es hora LOCAL, necesitamos convertirlo a UTC
 * y manejar cuando cruza medianoche en UTC
 */
function timeToUTCMinutesWithDay(time: string, timezone: string): TimeWithDay {
  const [hours, minutes] = time.split(':').map(Number)
  const localMinutes = hours * 60 + minutes
  const offset = getTimezoneOffset(timezone)

  // UTC minutes = local minutes - offset
  // Negative offset (like Colombia UTC-5) means: localMinutes - (-300) = localMinutes + 300
  // For 19:59 Colombia: 1199 + 300 = 1499 minutes UTC = 23:59 UTC same day
  // For 10:00 Colombia: 600 + 300 = 900 minutes UTC = 15:00 UTC same day
  let utcMinutes = localMinutes - offset

  // Determine day offset based on the UTC value
  // If local time is "behind" UTC (negative offset like UTC-5), times after midnight
  // in local will be > 1440 in UTC
  let dayOffset = 0
  if (utcMinutes < 0) {
    utcMinutes += 1440
    dayOffset = -1
  } else if (utcMinutes >= 1440) {
    utcMinutes -= 1440
    dayOffset = 1
  }

  return {
    minutesFromMidnight: utcMinutes,
    dayOffset,
  }
}

/**
 * Convierte minutos UTC a hora local con fecha calculada
 */
function minutesToLocalTimeWithDay(baseDate: string, utcMinutes: number, dayOffset: number, timezone: string): string {
  // First normalize minutes to 0-1439
  while (utcMinutes < 0) utcMinutes += 1440
  while (utcMinutes >= 1440) utcMinutes -= 1440

  // Apply day offset to get the actual date
  const baseDateObj = new Date(baseDate + 'T00:00:00Z')
  const targetDate = new Date(baseDateObj.getTime() + dayOffset * 24 * 60 * 60 * 1000)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  // Convert UTC minutes to local minutes
  const offset = getTimezoneOffset(timezone)
  let localMinutes = utcMinutes + offset
  while (localMinutes < 0) localMinutes += 1440
  while (localMinutes >= 1440) localMinutes -= 1440

  const h = Math.floor(localMinutes / 60) % 24
  const m = localMinutes % 60

  // Return as ISO string with the target date and local time converted to UTC for storage
  // The frontend will interpret this correctly in the user's timezone
  return `${targetDateStr}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00.000Z`
}

/**
 * Convierte minutos desde medianoche a TIME (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
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
 * Obtiene la disponibilidad de un empleado para un día específico (por day_of_week)
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
 * Obtiene override de disponibilidad para fecha específica
 */
async function getOverrideForDate(
  employeeId: string,
  date: string
): Promise<EmployeeAvailabilityOverride | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_availability_overrides')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    console.error('Error fetching override:', error.message)
    return null
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
 * Convierte las horas a minutos UTC para consistencia
 */
async function getAppointmentsForDate(
  employeeId: string,
  date: string,
  timezone: string
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
    .in('status', ['pending', 'confirmed'])

  if (error) {
    console.error('Error fetching appointments:', error.message)
    return []
  }

  // Convertir horas UTC a minutos UTC
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
    spa_opening_time: data?.spa_opening_time ?? '09:00',
    spa_closing_time: data?.spa_closing_time ?? '20:00',
  }
}

// =============================================================================
// GENERADOR DE SLOTS
// =============================================================================

/**
 * Genera los slots disponibles para un empleado, servicio y fecha específicos.
 * 
 * Algoritmo:
 * 1. Obtener day_of_week de la fecha
 * 2. Obtener configuración del spa (incluye timezone)
 * 3. Convertir horas locales a UTC para procesamiento
 * 4. Obtener override para fecha específica (si existe)
 * 5. Obtener disponibilidad normal del empleado (por day_of_week)
 * 6. Intersectar con horario del spa
 * 7. Generar slots dentro del rango válido
 * 8. Filtrar slots conflictivos con citas existentes
 * 
 * @param params.employeeId - ID del empleado
 * @param params.serviceId - ID del servicio
 * @param params.date - Fecha en formato YYYY-MM-DD
 * @param params.organizationId - ID de la organización
 * @param params.bypassNotice - Si es true, ignora min_notice_hours (para admin/owner)
 * @param params.bypassAvailability - Si es true, ignora disponibilidad (para force creation)
 * @returns Array de TimeSlot con disponibilidad
 */
export async function generateSlots({
  employeeId,
  serviceId,
  date,
  organizationId,
  bypassNotice = false,
  bypassAvailability = false,
}: GenerateSlotsParams): Promise<TimeSlot[]> {
  // 1. Parse date in local timezone
  const dateObj = new Date(`${date}T00:00:00`)
  const dayOfWeek = dateObj.getDay()

  // 2. Obtener configuración de booking (incluye spa hours y timezone)
  const settings = await getBookingSettings(organizationId)
  const timezone = settings.timezone || 'UTC'
  
  // 3. Convertir spa hours de local a UTC para procesamiento interno
  const spaStartMinutes = timeToMinutesUTC(settings.spa_opening_time, timezone)
  const spaEndMinutes = timeToMinutesUTC(settings.spa_closing_time, timezone)

  // 4. Check spa global override (cierre total o horario especial del spa)
  const spaOverride = await getSpaOverrideForDate(organizationId, date)

  if (spaOverride?.is_day_off) {
    return []
  }

  // 5. Check override para fecha específica del empleado
  const override = await getOverrideForDate(employeeId, date)

  // Si es día libre, no generar slots
  if (override?.is_day_off) {
    return []
  }

  // 6. Obtener disponibilidad del empleado para ese día
  const availability = await getEmployeeAvailabilityForDay(employeeId, dayOfWeek)

  if (!availability && !override) {
    return []
  }

  // 7. Determinar rango de tiempo efectivo (en minutos UTC)
  // Priority: Employee Override > Spa Global Override > Normal availability
  let effectiveStartMinutes: number
  let effectiveEndMinutes: number

  if (override?.start_time && override?.end_time) {
    effectiveStartMinutes = timeToMinutesUTC(override.start_time, timezone)
    effectiveEndMinutes = timeToMinutesUTC(override.end_time, timezone)
  } else if (override?.start_time && !override?.end_time) {
    effectiveStartMinutes = timeToMinutesUTC(override.start_time, timezone)
    effectiveEndMinutes = timeToMinutesUTC(availability!.end_time, timezone)
  } else if (!override?.start_time && override?.end_time) {
    effectiveStartMinutes = timeToMinutesUTC(availability!.start_time, timezone)
    effectiveEndMinutes = timeToMinutesUTC(override.end_time, timezone)
  } else if (override && !override.start_time && !override.end_time) {
    return []
  } else {
    effectiveStartMinutes = timeToMinutesUTC(availability!.start_time, timezone)
    effectiveEndMinutes = timeToMinutesUTC(availability!.end_time, timezone)
  }

  // 8. Apply spa global override if exists (further restricts the range)
  if (spaOverride?.start_time && spaOverride?.end_time) {
    const spaOverrideStart = timeToMinutesUTC(spaOverride.start_time, timezone)
    const spaOverrideEnd = timeToMinutesUTC(spaOverride.end_time, timezone)
    effectiveStartMinutes = Math.max(effectiveStartMinutes, spaOverrideStart)
    effectiveEndMinutes = Math.min(effectiveEndMinutes, spaOverrideEnd)
  }

  // 9. Si bypassAvailability, usar spa hours como límites
  if (bypassAvailability) {
    effectiveStartMinutes = spaStartMinutes
    effectiveEndMinutes = spaEndMinutes
  }

  // 10. Intersectar con horario del spa
  // NOTA: Si el horario del empleado cruza medianoche (ej: 20:00-02:00),
  // actualStartMinutes < actualEndMinutes en UTC normalizado
  // Y la comparación es al revés: el empleado trabaja desde actualStartMinutes
  // HASTA medianoche Y desde medianoche HASTA actualEndMinutes
  let actualStartMinutes = Math.max(effectiveStartMinutes, spaStartMinutes)
  let actualEndMinutes = Math.min(effectiveEndMinutes, spaEndMinutes)

  // Si actualStartMinutes > actualEndMinutes, significa que el rango cruza medianoche
  // En ese caso, ajustamos para que el loop funcione correctamente:
  // - El rango de trabajo en UTC normalizado va desde start hasta 1440, y desde 0 hasta end
  // - Solo tomamos el rango que se interseca con spa hours
  const crossesMidnight = actualStartMinutes > actualEndMinutes

  // Si no hay rango válido, no generar slots
  // Para horarios que cruzan midnight, siempre hay un rango válido (hasta 1440 o desde 0)
  if (!crossesMidnight && actualStartMinutes >= actualEndMinutes) {
    return []
  }

  // 11. Obtener duración del servicio
  const serviceDuration = await getServiceDuration(serviceId)

  // 12. Obtener citas existentes para ese día
  const bookedSlots = await getAppointmentsForDate(employeeId, date, timezone)

  // 13. Generar slots
  const slots: TimeSlot[] = []
  const slotInterval = settings.slot_interval
  const buffer = settings.buffer_minutes

  // Calcular hora mínima de reserva (ahora + min_notice_hours)
  const minBookingTime = bypassNotice
    ? 0
    : Date.now() + settings.min_notice_hours * 60 * 60 * 1000

  // Función auxiliar para procesar un rango de tiempo
  const processTimeRange = (startMin: number, endMin: number) => {
    for (let time = startMin; time + serviceDuration <= endMin; time += slotInterval) {
      const slotStart = time
      const slotEnd = time + serviceDuration + buffer

      // Verificar si el slot está en el pasado (comparando en hora local)
      // Usar minutesToTimeLocal para que la comparación sea consistente con cómo se generan los slots
      const slotDateTime = new Date(`${date}T${minutesToTimeLocal(time, timezone)}:00.000`)
      const isPast = slotDateTime.getTime() < minBookingTime
      console.log(`[DEBUG generateSlots] Slot ${minutesToTimeLocal(time, timezone)}: isPast=${isPast}, slotDateTime=${slotDateTime.getTime()}, minBookingTime=${minBookingTime}`)

      // Verificar si el slot colisiona con citas existentes
      const isBooked = bookedSlots.some((booked) =>
        rangesOverlap(slotStart, slotEnd - buffer, booked.start, booked.end)
      )

      // Determinar razón de bloqueo
      let blockedReason: string | undefined
      if (isBooked) {
        blockedReason = 'Ya reservado'
      } else if (isPast) {
        blockedReason = 'Ya pasó'
      }

      // Agregar slot - las horas se convierten a TIME local para el ISO string
      // SIN sufijo Z para mantener compatibilidad con display y validaciones
      slots.push({
        start_time: `${date}T${minutesToTimeLocal(time, timezone)}:00.000`,
        end_time: `${date}T${minutesToTimeLocal(slotEnd - buffer, timezone)}:00.000`,
        available: !isBooked && !isPast,
        blockedReason,
      })
    }
  }

  // Si el horario cruza medianoche (ej: empleado trabaja 20:00-02:00),
  // procesamos en dos partes: desde start hasta 1440, y desde 0 hasta end
  if (crossesMidnight) {
    // Parte 1: desde actualStartMinutes hasta medianoche (1440)
    processTimeRange(actualStartMinutes, 1440)
    // Parte 2: desde medianoche (0) hasta actualEndMinutes
    processTimeRange(0, actualEndMinutes)
  } else {
    // Horario normal sin cruzar medianoche
    processTimeRange(actualStartMinutes, actualEndMinutes)
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
  bypassNotice = false,
}: {
  employeeIds: string[]
  serviceId: string
  date: string
  organizationId: string
  bypassNotice?: boolean
}): Promise<Record<string, TimeSlot[]>> {
  const results: Record<string, TimeSlot[]> = {}

  await Promise.all(
    employeeIds.map(async (employeeId) => {
      results[employeeId] = await generateSlots({
        employeeId,
        serviceId,
        date,
        organizationId,
        bypassNotice,
      })
    })
  )

  return results
}