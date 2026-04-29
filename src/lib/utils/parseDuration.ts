/**
 * Parse a duration string into minutes.
 * Supports multiple formats:
 * - "90" → 90 (direct minutes)
 * - "1" → 60 (hours as number)
 * - "1:30" → 90 (HH:MM format)
 * - "2" → 120 (hours as number)
 * - "2:30" → 150 (HH:MM format)
 * - "2.5" → 150 (decimal hours)
 *
 * @param input - The duration string to parse
 * @returns The duration in minutes, or null if invalid
 */
export function parseDuration(input: string): number | null {
  if (!input || typeof input !== 'string') return null

  const trimmed = input.trim()

  if (!trimmed) return null

  // Direct number (minutes)
  const directMinutes = Number(trimmed)
  if (!isNaN(directMinutes) && trimmed.match(/^\d+$/)) {
    return Math.max(5, directMinutes) // Minimum 5 minutes
  }

  // HH:MM or H:MM format
  const timeMatch = trimmed.match(/^(\d+):(\d{1,2})$/)
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)
    if (minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes
    }
  }

  // Decimal hours (e.g., "2.5" → 150 minutes)
  const decimalMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|horas?)?$/i)
  if (decimalMatch) {
    const hours = parseFloat(decimalMatch[1])
    if (!isNaN(hours) && hours > 0) {
      return Math.round(hours * 60)
    }
  }

  // "Xh Ym" or "Xhours Yminutes" format
  const hmMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*h(?:ours?|rs?|)?[\s,]+(\d+)\s*m(?:in(?:utes?)?)?$/i
  )
  if (hmMatch) {
    const hours = parseFloat(hmMatch[1])
    const minutes = parseInt(hmMatch[2], 10)
    if (!isNaN(hours) && !isNaN(minutes) && minutes >= 0 && minutes < 60) {
      return Math.round(hours * 60) + minutes
    }
  }

  // Just "Xh" or "Xhr" format
  const hOnlyMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?|rs?|)?$/i)
  if (hOnlyMatch) {
    const hours = parseFloat(hOnlyMatch[1])
    if (!isNaN(hours) && hours > 0) {
      return Math.round(hours * 60)
    }
  }

  // Just "Xm" or "Xmin" format
  const mOnlyMatch = trimmed.match(/^(\d+)\s*m(?:in(?:utes?)?)?$/i)
  if (mOnlyMatch) {
    const minutes = parseInt(mOnlyMatch[1], 10)
    if (!isNaN(minutes) && minutes > 0) {
      return minutes
    }
  }

  return null
}

/**
 * Format minutes into a human-readable display string.
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 30min"
 */
export function formatDurationDisplay(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}min`
}

/**
 * Check if input contains a time-like pattern (needs parsing)
 * @param input - The string to check
 * @returns true if the input looks like a time format that needs parsing
 */
export function needsParsing(input: string): boolean {
  if (!input || typeof input !== 'string') return false

  const trimmed = input.trim()

  // Contains time separators or units
  if (trimmed.includes(':')) return true
  if (/h$/i.test(trimmed)) return true
  if (/hr?s?$/i.test(trimmed)) return true
  if (/min$/i.test(trimmed)) return true
  if (trimmed.includes('.')) return true // Decimal hours

  return false
}

/**
 * Format a duration input string into a human-readable display.
 * "1:30" → "1h 30min"
 * "2h" → "2h"
 * "90" → "90 min"
 * "2.5" → "2h 30min"
 *
 * @param input - The raw duration string input by user
 * @returns Formatted duration string, or original input if invalid
 */
export function formatDurationInput(input: string): string {
  if (!input || typeof input !== 'string') return input

  const trimmed = input.trim()
  if (!trimmed) return input

  const parsed = parseDuration(trimmed)
  if (parsed === null) return input

  return formatDurationDisplay(parsed)
}

/**
 * Clean a duration input by keeping only valid duration characters.
 * @param value - The input value
 * @returns Cleaned string with only valid duration characters
 */
export function cleanDurationInput(value: string): string {
  // Allow digits, colon, h, m, and period
  return value.replace(/[^\d:hHmM.\s]/g, '')
}