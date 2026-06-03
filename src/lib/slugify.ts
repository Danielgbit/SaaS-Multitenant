/**
 * Slugify function - frontend version
 * Must match PostgreSQL slugify() function in migrations
 *
 * Rules:
 * 1. Trim input
 * 2. Convert to lowercase
 * 3. Remove accents (unaccent equivalent)
 * 4. Remove special characters (keep a-z, 0-9, spaces, hyphens)
 * 5. Replace spaces with hyphens
 * 6. Replace multiple hyphens with single
 * 7. Trim hyphens from start/end
 * 8. Return 'negocio' if result is empty
 */
export function slugify(input: string): string {
  if (!input || !input.trim()) {
    return 'negocio'
  }

  const result = input
    .trim()
    .normalize('NFD')                           // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')            // Remove combining marks (accents)
    .toLowerCase()                              // Lowercase AFTER removing accents
    .replace(/[^a-z0-9\s-]/g, '')               // Remove special characters
    .replace(/\s+/g, '-')                       // Spaces → hyphens
    .replace(/-{2,}/g, '-')                     // Multiple hyphens → single
    .replace(/^-+|-+$/g, '')                    // Trim hyphens from start/end

  return result || 'negocio'
}

/**
 * Reserved slugs that cannot be used for organizations
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'login',
  'logout',
  'dashboard',
  'settings',
  'profile',
  'billing',
  'book',
  'booking',
  'reservar',
  'calendar',
  'public',
  'static',
  'www',
  'app',
  'help',
  'support',
  'contact',
  'about',
  'terms',
  'privacy',
  'legal',
  'docs',
] as const

/**
 * Validate a slug format
 * Returns null if valid, error message if invalid
 */
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) {
    return 'Mínimo 3 caracteres'
  }

  if (slug.length > 50) {
    return 'Máximo 50 caracteres'
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Solo minúsculas, números y guiones'
  }

  if (slug.startsWith('-')) {
    return 'No puede empezar con guión'
  }

  if (slug.endsWith('-')) {
    return 'No puede terminar con guión'
  }

  if ((RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase())) {
    return 'Este slug está reservado'
  }

  return null
}

/**
 * Format slug for display (add hyphens between words)
 * Used for auto-generating slug from organization name
 */
export function generateSlugFromName(name: string): string {
  return slugify(name)
}
