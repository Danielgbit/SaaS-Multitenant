'use client'

/**
 * Formats an ISO datetime string to 12-hour format with AM/PM
 * @param isoString - ISO datetime string (e.g., "2026-04-22T15:00:00.000Z")
 * @returns Formatted time string (e.g., "3:00 PM")
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Formats an ISO datetime string to 24-hour format (no AM/PM)
 * @param isoString - ISO datetime string
 * @returns Formatted time string (e.g., "15:00")
 */
export function formatTime24(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Formats a date string (YYYY-MM-DD) to localized date
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }
): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', options)
}

/**
 * Converts 12-hour time string (e.g., "3:00 PM") to 24-hour format (e.g., "15:00")
 * @param timeStr - Time string in 12-hour format with AM/PM
 * @returns Time string in 24-hour format
 */
export function convertTo24Hour(timeStr: string): string {
  const [time, period] = timeStr.split(' ')
  const [hours, minutes] = time.split(':').map(Number)

  let hours24 = hours
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours24 += 12
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours24 = 0
  }

  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}