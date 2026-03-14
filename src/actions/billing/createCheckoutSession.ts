'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripeInstance } from '@/lib/stripe'
import { z } from 'zod'

const CreateCheckoutSchema = z.object({
  planId: z.string().uuid(),
  organizationId: z.string().uuid(),
})

export async function createCheckoutSession(input: {
  planId: string
  organizationId: string
}): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const stripe = getStripeInstance()
  const parsed = CreateCheckoutSchema.safeParse(input)
  
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { planId, organizationId } = parsed.data
  const supabase = await createClient()

  try {
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { success: false, error: 'Plan no encontrado' }
    }

    const stripePriceId = (plan as Record<string, unknown>).stripe_price_id as string | null
    
    if (!stripePriceId) {
      return { success: false, error: 'Este plan no requiere pago' }
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return { success: false, error: 'Organización no encontrada' }
    }

    let customerId: string | undefined

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    const existingCustomerId = (subscription as Record<string, unknown>)?.stripe_customer_id as string | null
    
    if (existingCustomerId) {
      customerId = existingCustomerId
    } else {
      const customer = await stripe.customers.create({
        metadata: {
          organization_id: organizationId,
        },
        name: organization.name,
      })
      customerId = customer.id

      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId } as Record<string, unknown>)
        .eq('organization_id', organizationId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    })

    if (!session.url) {
      return { success: false, error: 'Error al crear sesión de pago' }
    }

    return { success: true, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { success: false, error: 'Error al procesar el pago' }
  }
}
