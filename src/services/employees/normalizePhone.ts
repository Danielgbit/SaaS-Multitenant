/**
 * Normalizes a phone number for consistent storage and comparison.
 * Removes spaces, leading +, and non-numeric characters.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return ''
  
  return phone
    .replace(/\s+/g, '')     // Remove all spaces
    .replace(/^\+/, '')      // Remove leading + if present
    .replace(/[^0-9]/g, '')  // Keep only digits
}
