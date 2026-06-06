'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { RESERVED_SLUGS } from '@/lib/slugify'
import { checkSlugAvailability } from './checkSlugAvailability'

const OrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones')
    .refine(s => !s.startsWith('-'), 'No puede empezar con guión')
    .refine(s => !s.endsWith('-'), 'No puede terminar con guión')
    .refine(s => !(RESERVED_SLUGS as readonly string[]).includes(s), 'Este slug está reservado'),
})

export async function updateOrganization(
  organizationId: string,
  data: { name?: string; slug?: string }
) {
  const supabase = await createClient()

  // Get current organization data for revalidation
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', organizationId)
    .single()

  const oldSlug = currentOrg?.slug

  if (data.name || data.slug) {
    const validation = OrganizationSchema.safeParse({
      name: data.name,
      slug: data.slug,
    })

    if (!validation.success) {
      return { 
        success: false, 
        error: 'Datos de organización inválidos',
        details: validation.error.flatten() 
      }
    }
  }

  // Check slug uniqueness if changing
  if (data.slug && data.slug !== oldSlug) {
    const isAvailable = await checkSlugAvailability(data.slug, organizationId)
    if (!isAvailable) {
      return { success: false, error: 'Este slug ya está en uso' }
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', organizationId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate settings page
  revalidatePath('/ajustes')

  // Revalidate booking pages (old and new slug)
  if (data.slug && oldSlug && data.slug !== oldSlug) {
    revalidatePath(`/reservar/${oldSlug}`)
    revalidatePath(`/reservar/${data.slug}`)
  }

  return { success: true }
}
