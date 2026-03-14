'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripeInstance } from '@/lib/stripe'

export async function createPortalSession(
  organizationId: string
): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const supabase = await createClient()
  const stripe = getStripeInstance()

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single()

    if (error || !subscription) {
      return { success: false, error: 'Suscripción no encontrada' }
    }

    const customerId = (subscription as unknown as Record<string, unknown>).stripe_customer_id as string | null

    if (!customerId) {
      return { success: false, error: 'No tienes un método de pago registrado' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })

    if (!session.url) {
      return { success: false, error: 'Error al crear portal de facturación' }
    }

    return { success: true, url: session.url }
  } catch (error) {
    console.error('Error creating portal session:', error)
    return { success: false, error: 'Error al procesar la solicitud' }
  }
}
