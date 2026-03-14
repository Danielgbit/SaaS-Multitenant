'use server'

import { createClient } from '@/lib/supabase/server'
import { getTrialDaysRemaining, isTrialExpired } from '@/lib/billing/utils'

export async function getSubscription(
  organizationId: string
): Promise<{
  success: boolean
  data?: Record<string, unknown>
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error || !subscription) {
      return { success: false, error: 'Suscripción no encontrada' }
    }

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single()

    const trialDaysRemaining = getTrialDaysRemaining(subscription.trial_ends_at)
    const isActive = subscription.status === 'active' || 
      (subscription.status === 'trial' && !isTrialExpired(subscription.trial_ends_at))

    return {
      success: true,
      data: {
        ...subscription,
        planName: plan?.name || 'Unknown',
        planPrice: plan?.price || 0,
        planWhatsApp: plan?.whatsapp_enabled || false,
        planEmployees: plan?.max_employees || 0,
        planServices: plan?.max_services || 0,
        trialDaysRemaining,
        isActive,
      },
    }
  } catch (error) {
    console.error('Error in getSubscription:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
