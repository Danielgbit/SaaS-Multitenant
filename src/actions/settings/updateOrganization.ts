'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const OrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
})

export async function updateOrganization(
  organizationId: string,
  data: { name?: string; slug?: string }
) {
  const supabase = await createClient()

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

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', organizationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')

  return { success: true }
}
