'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requirePlatformAdmin } from '@/lib/auth/platform-auth'
import { logAudit } from '@/lib/audit'
import { AdminAuditAction } from '@/lib/audit/types'
import { adminActionLimiter } from '@/lib/rate-limiter'
import { headers } from 'next/headers'
import { getClientIp } from '@/lib/network/get-client-ip'

const reactivateSchema = z.object({
  organizationId: z.string().uuid(),
})

export type ReactivateOrgState = {
  success?: boolean
  error?: string
}

export async function reactivateOrganization(
  prevState: ReactivateOrgState,
  formData: FormData
): Promise<ReactivateOrgState> {
  const supabase = await createClient()

  let user
  try {
    user = await requirePlatformAdmin()
  } catch {
    return { error: 'No tienes permisos de admin' }
  }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)
  const rateKey = `admin:reactivateOrg:${user.id}`
  const rateCheck = adminActionLimiter.check(rateKey)
  if (!rateCheck.allowed) {
    return { error: 'Demasiadas operaciones. Intenta de nuevo en unos segundos.' }
  }

  const validated = reactivateSchema.safeParse({
    organizationId: formData.get('organizationId'),
  })

  if (!validated.success) {
    return { error: 'Datos inválidos' }
  }

  const { organizationId } = validated.data

  const { data: org } = await supabase
    .from('organizations')
    .select('id, status, name')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return { error: 'Organización no encontrada' }
  }

  if (org.status !== 'suspended') {
    return { success: true }
  }

  adminActionLimiter.hit(rateKey, { ip, route: 'reactivateOrganization', userId: user.id })

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ status: 'active', status_reason: null })
    .eq('id', organizationId)

  if (updateError) {
    return { error: 'Error al reactivar la organización' }
  }

  try {
    await logAudit({
      adminUserId: user.id,
      action: AdminAuditAction.REACTIVATE_ORGANIZATION,
      entityType: 'organization',
      entityId: organizationId,
      metadata: { orgName: org.name },
    })
  } catch (auditError) {
    console.error('[reactivateOrganization] audit error:', auditError)
  }

  try {
    revalidateTag('platform-metrics', 'max')
    revalidateTag('platform-organizations', 'max')
  } catch (e) {
    console.warn('[reactivateOrganization] revalidateTag error:', e)
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organizationId}`)

  return { success: true }
}
