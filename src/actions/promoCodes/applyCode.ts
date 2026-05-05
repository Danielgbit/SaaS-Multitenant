'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateCode } from './validateCode'

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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    return { error: 'No tienes organización' }
  }

  const code = formData.get('code') as string
  const { valid, error, promoCode } = await validateCode(code)

  if (!valid || !promoCode) {
    return { error: error || 'Código no válido' }
  }

  const { data: existingUse } = await supabase
    .from('promo_code_uses')
    .select('id')
    .eq('promo_code_id', promoCode.id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (existingUse) {
    return { error: 'Ya usaste este código' }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, trial_ends_at')
    .eq('organization_id', orgMember.organization_id)
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
        .update({ trial_ends_at: newTrialEndsAt.toISOString() })
        .eq('organization_id', orgMember.organization_id)
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
        })
        .eq('organization_id', orgMember.organization_id)
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
      organization_id: orgMember.organization_id,
    })

  await supabase
    .from('promo_codes')
    .update({ used_count: promoCode.usedCount + 1 })
    .eq('id', promoCode.id)

  revalidatePath('/dashboard/billing')
  return { success: true, newTrialEndsAt: newTrialEndsAt?.toISOString() }
}