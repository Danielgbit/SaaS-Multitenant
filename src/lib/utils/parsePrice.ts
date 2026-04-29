/**
 * Format a raw number string into Colombian pesos format with thousand separators.
 * "20000" → "20.000"
 * "500" → "500"
 * "100000" → "100.000"
 *
 * @param value - The raw number string (digits only)
 * @returns Formatted string with dots as thousand separators
 */
export function formatPriceInput(value: string): string {
  if (!value || value === '') return ''

  const cleaned = value.replace(/[^\d]/g, '')

  if (!cleaned) return ''

  const num = parseInt(cleaned, 10)
  if (isNaN(num)) return ''

  return num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Parse a formatted price string to a number for database storage.
 * Handles Colombian peso format: points as thousand separators, no decimals.
 * "20.000" → 20000
 * "500" → 500
 * "100.000" → 100000
 *
 * @param value - The formatted price string from input
 * @returns Number ready for database storage
 */
export function parsePriceToNumber(value: string): number {
  if (!value || value === '') return 0

  const cleaned = value.replace(/[^\d]/g, '')

  if (!cleaned) return 0

  const num = parseInt(cleaned, 10)

  if (isNaN(num)) return 0

  // If value < 100, assume it's in "thousands" (e.g., "20" means $20.000)
  if (num < 100) {
    return num * 1000
  }

  return num
}

/**
 * Format a number as Colombian pesos display.
 * 20000 → "$20.000 COP"
 *
 * @param value - The number to format
 * @returns Formatted currency string
 */
export function formatPriceCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Check if a string needs price formatting (has thousand separators).
 * @param value - The string to check
 * @returns true if the value looks like it needs parsing
 */
export function needsPriceParsing(value: string): boolean {
  if (!value) return false

  // Has formatting characters other than digits
  if (/[.\,]/.test(value)) return true

  // Is a short number that might be in "thousands" format
  const cleaned = value.replace(/[^\d]/g, '')
  const num = parseInt(cleaned, 10)

  return num > 0 && num < 1000
}

/**
 * Clean a price input to only digits.
 * @param value - The input value
 * @returns Only digits from the input
 */
export function cleanPriceInput(value: string): string {
  return value.replace(/[^\d]/g, '')
}

/**
 * Convert a database price (in COP) to display format.
 * 20000 → "20.000"
 *
 * @param dbPrice - The price from database
 * @returns Formatted string for display/input
 */
export function dbPriceToInputFormat(dbPrice: number): string {
  if (dbPrice === 0) return ''

  return dbPrice.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Convert user input (in thousands) to database format.
 * "20.000" (display) → 20000 (db)
 * Handles values < 100 as thousand multiplier.
 *
 * @param inputValue - The formatted input value
 * @returns Database-ready number
 */
export function inputToDbPrice(inputValue: string): number {
  return parsePriceToNumber(inputValue)
}