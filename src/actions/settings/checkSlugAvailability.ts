'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Check if a slug is available for use
 * @param slug - The slug to check
 * @param organizationId - Optional: exclude this organization from the check
 * @returns true if slug is available, false if taken
 */
export async function checkSlugAvailability(
  slug: string,
  organizationId?: string
): Promise<boolean> {
  // Basic validation
  if (!slug || slug.length < 3) {
    return false
  }

  const supabase = await createClient()

  let query = supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  // Exclude current organization when editing
  if (organizationId) {
    query = query.neq('id', organizationId)
  }

  const { count } = await query
  return count === 0
}
