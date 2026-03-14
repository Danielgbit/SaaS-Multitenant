'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripeInstance } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CancelSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
})

export async function cancelSubscription(
  input: z.infer<typeof CancelSubscriptionSchema>
): Promise<{
  success: boolean
  error?: string
}> {
  const stripe = getStripeInstance()
  const parsed = CancelSubscriptionSchema.safeParse(input)

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
        cancel_at_period_end: true,
      })
    }

    await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('organization_id', organizationId)

    revalidatePath('/dashboard/billing')

    return { success: true }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return { success: false, error: 'Error al cancelar la suscripción' }
  }
}
