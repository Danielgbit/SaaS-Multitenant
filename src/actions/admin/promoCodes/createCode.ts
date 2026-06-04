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

const createCodeSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  name: z.string().min(1).max(255),
  type: z.enum(['trial_extension', 'grace_period', 'free_month', 'discount']),
  value: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable(),
  expiresAt: z.string().datetime().nullable(),
  validUntil: z.string().datetime().nullable(),
})

export type CreateCodeState = {
  success?: boolean
  error?: string
  codeId?: string
}

export async function createCode(
  prevState: CreateCodeState,
  formData: FormData
): Promise<CreateCodeState> {
  const supabase = await createClient()

  let user
  try {
    user = await requirePlatformAdmin()
  } catch {
    return { error: 'No tienes permisos de admin' }
  }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)
  const rateKey = `admin:createCode:${user.id}`
  const rateCheck = adminActionLimiter.check(rateKey)
  if (!rateCheck.allowed) {
    return { error: 'Demasiadas operaciones. Intenta de nuevo en unos segundos.' }
  }

  const rawData = {
    code: formData.get('code'),
    name: formData.get('name'),
    type: formData.get('type'),
    value: formData.get('value'),
    maxUses: formData.get('maxUses'),
    expiresAt: formData.get('expiresAt'),
    validUntil: formData.get('validUntil'),
  }

  const validated = createCodeSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { data: existing } = await supabase
    .from('promo_codes')
    .select('id')
    .eq('code', validated.data.code)
    .single()

  if (existing) {
    return { error: 'Este código ya existe' }
  }

  adminActionLimiter.hit(rateKey, { ip, route: 'createCode', userId: user.id })

  const { data: newCode, error } = await supabase
    .from('promo_codes')
    .insert({
      code: validated.data.code,
      name: validated.data.name,
      type: validated.data.type,
      value: validated.data.value,
      max_uses: validated.data.maxUses,
      expires_at: validated.data.expiresAt || null,
      valid_until: validated.data.validUntil || null,
      created_by: user.id,
    } as any)
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al crear código' }
  }

  try {
    await logAudit({
      adminUserId: user.id,
      action: AdminAuditAction.CREATE_PROMO_CODE,
      entityType: 'promo_code',
      entityId: newCode.id,
      metadata: { code: validated.data.code, type: validated.data.type },
    })
  } catch (auditError) {
    console.error('[createCode] audit error:', auditError)
  }

  try {
    revalidateTag('platform-metrics', 'max')
  } catch (e) {
    console.warn('[createCode] revalidateTag error:', e)
  }

  revalidatePath('/admin/promo-codes')
  return { success: true, codeId: newCode.id }
}
