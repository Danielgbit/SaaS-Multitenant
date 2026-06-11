'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { validateCode } from './validateCode'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'
import type { Database } from '@db/supabase'

const ApplyCodeSchema = z.object({
  code: z.string().trim().min(1, 'Código requerido').max(50).transform(v => v.toUpperCase()),
})

export type ApplyCodeState = {
  success?: boolean
  error?: string
  newTrialEndsAt?: string
}

export async function applyCode(
  prevState: ApplyCodeState,
  formData: FormData
): Promise<ApplyCodeState> {
  const supabase = await createClient()
  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const rawCode = { code: formData.get('code') as string }
  const parsed = ApplyCodeSchema.safeParse(rawCode)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Código inválido' }
  }
  const code = parsed.data.code
  const { valid, error, promoCode } = await validateCode(code)

  if (!valid || !promoCode) {
    return { error: error || 'Código no válido' }
  }

  const { data: existingUse } = await supabase
    .from('promo_code_uses')
    .select('id')
    .eq('promo_code_id', promoCode.id)
    .eq('organization_id', access.context.organizationId)
    .maybeSingle()

  if (existingUse) {
    return { error: 'Ya usaste este código' }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, trial_ends_at')
    .eq('organization_id', access.context.organizationId)
    .single()

  if (!subscription) {
    return { error: 'No tienes suscripción' }
  }

  let newTrialEndsAt: Date | null = null

  switch (promoCode.type) {
    case 'trial_extension': {
      const currentTrialEnd = subscription.trial_ends_at
        ? new Date(subscription.trial_ends_at)
        : new Date()
      newTrialEndsAt = new Date(currentTrialEnd.getTime() + promoCode.value * 24 * 60 * 60 * 1000)

      await supabase
        .from('subscriptions')
        .update({ trial_ends_at: newTrialEndsAt.toISOString() } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('organization_id', access.context.organizationId)
      break
    }
    case 'grace_period': {
      const currentTrialEnd = subscription.trial_ends_at
        ? new Date(subscription.trial_ends_at)
        : new Date()
      newTrialEndsAt = new Date(currentTrialEnd.getTime() + promoCode.value * 24 * 60 * 60 * 1000)

      await supabase
        .from('subscriptions')
        .update({
          status: 'grace_period',
          trial_ends_at: newTrialEndsAt.toISOString(),
        } satisfies Database['public']['Tables']['subscriptions']['Update'])
        .eq('organization_id', access.context.organizationId)
      break
    }
    case 'free_month':
      return { error: 'Esta función aún no está disponible' }
    case 'discount':
      return { error: 'Esta función aún no está disponible' }
  }

  await supabase
    .from('promo_code_uses')
    .insert({
      promo_code_id: promoCode.id,
      organization_id: access.context.organizationId,
    } satisfies Database['public']['Tables']['promo_code_uses']['Insert'])

  await supabase
    .from('promo_codes')
    .update({ used_count: promoCode.usedCount + 1 } satisfies Database['public']['Tables']['promo_codes']['Update'])
    .eq('id', promoCode.id)

  revalidatePath('/dashboard/facturacion')
  return { success: true, newTrialEndsAt: newTrialEndsAt?.toISOString() }
}