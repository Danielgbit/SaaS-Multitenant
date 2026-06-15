/**
 * Pure formatting functions for appointment dates and times.
 *
 * Uses es-CO locale and America/Bogota timezone.
 * These are separate from @/lib/utils/formatTime to keep locale/timezone
 * concerns scoped to the confirmation-links module and avoid assumptions
 * about the user's UI locale context.
 *
 * @module formatDateTime
 *
 * @warning Both `formatDate` and `formatTime` have identically-named exports in
 * `@/lib/utils/formatTime.ts` (en-US/es-ES locale). Importing from both modules
 * in the same file will cause a naming collision. Prefer one module per file.
 * If both are needed, use a namespace import or aliased import.
 */

/**
 * Formats an ISO datetime string to a localized date string.
 *
 * @param dateStr - ISO 8601 datetime string (e.g., "2026-04-22T15:00:00.000Z")
 * @returns Formatted date (e.g., "lunes, 22 de abril de 2026")
 *
 * @example
 * formatDate("2026-04-22T15:00:00.000Z")
 * // => "martes, 22 de abril de 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

/**
 * Formats an ISO datetime string to a localized time string.
 *
 * @param dateStr - ISO 8601 datetime string (e.g., "2026-04-22T15:00:00.000Z")
 * @returns Formatted time (e.g., "10:00 a.\u00a0m.")
 *
 * @example
 * formatTime("2026-04-22T15:00:00.000Z")
 * // => "10:00 a.\u00a0m."
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}
