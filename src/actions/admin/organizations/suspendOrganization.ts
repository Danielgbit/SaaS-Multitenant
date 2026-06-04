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

const suspendSchema = z.object({
  organizationId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

export type SuspendOrgState = {
  success?: boolean
  error?: string
}

export async function suspendOrganization(
  prevState: SuspendOrgState,
  formData: FormData
): Promise<SuspendOrgState> {
  const supabase = await createClient()

  let user
  try {
    user = await requirePlatformAdmin()
  } catch {
    return { error: 'No tienes permisos de admin' }
  }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)
  const rateKey = `admin:suspendOrg:${user.id}`
  const rateCheck = adminActionLimiter.check(rateKey)
  if (!rateCheck.allowed) {
    return { error: 'Demasiadas operaciones. Intenta de nuevo en unos segundos.' }
  }

  const validated = suspendSchema.safeParse({
    organizationId: formData.get('organizationId'),
    reason: formData.get('reason'),
  })

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { organizationId, reason } = validated.data

  const { data: org } = await supabase
    .from('organizations')
    .select('id, status, name')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return { error: 'Organización no encontrada' }
  }

  if (org.status === 'suspended') {
    return { success: true }
  }

  adminActionLimiter.hit(rateKey, { ip, route: 'suspendOrganization', userId: user.id })

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ status: 'suspended', status_reason: reason })
    .eq('id', organizationId)

  if (updateError) {
    return { error: 'Error al suspender la organización' }
  }

  try {
    await logAudit({
      adminUserId: user.id,
      action: AdminAuditAction.SUSPEND_ORGANIZATION,
      entityType: 'organization',
      entityId: organizationId,
      metadata: { reason, orgName: org.name },
    })
  } catch (auditError) {
    console.error('[suspendOrganization] audit error:', auditError)
  }

  try {
    revalidateTag('platform-metrics', 'max')
    revalidateTag('platform-organizations', 'max')
  } catch (e) {
    console.warn('[suspendOrganization] revalidateTag error:', e)
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organizationId}`)

  return { success: true }
}
