'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripeInstance } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ReactivateSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
})

export async function reactivateSubscription(
  input: z.infer<typeof ReactivateSubscriptionSchema>
): Promise<{
  success: boolean
  error?: string
}> {
  const stripe = getStripeInstance()
  const parsed = ReactivateSubscriptionSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { organizationId } = parsed.data
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

    const stripeSubscriptionId = (subscription as unknown as Record<string, unknown>).stripe_subscription_id as string | null

    if (stripeSubscriptionId) {
      await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: false,
      })
    }

    await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: false,
        canceled_at: null,
      } as Record<string, unknown>)
      .eq('organization_id', organizationId)

    revalidatePath('/dashboard/billing')

    return { success: true }
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return { success: false, error: 'Error al reactivar la suscripción' }
  }
}
