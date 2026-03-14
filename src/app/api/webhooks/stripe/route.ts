import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const organizationId = session.metadata?.organization_id
        const planId = session.metadata?.plan_id

        if (!organizationId || !planId) {
          console.error('Missing metadata in checkout.session.completed')
          break
        }

        const subscriptionId = session.subscription as string

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan_id: planId,
            stripe_subscription_id: subscriptionId,
            trial_ends_at: null,
          } as any)
          .eq('organization_id', organizationId)

        console.log(`Checkout completed for org ${organizationId}, subscription: ${subscriptionId}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        const customerId = invoice.customer as string

        if (!subscriptionId) break

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!subscription) break

        const periodStart = new Date(invoice.period_start * 1000).toISOString()
        const periodEnd = new Date(invoice.period_end * 1000).toISOString()

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
          } as any)
          .eq('organization_id', subscription.organization_id)

        await (supabase.from('invoices' as any).insert({
          organization_id: subscription.organization_id,
          stripe_invoice_id: invoice.id,
          invoice_number: invoice.number,
          amount_cents: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          period_start: periodStart,
          period_end: periodEnd,
          paid_at: new Date().toISOString(),
          invoice_pdf_url: invoice.invoice_pdf,
        }) as any)

        console.log(`Payment succeeded for subscription ${subscriptionId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!subscription) break

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' } as any)
          .eq('organization_id', subscription.organization_id)

        console.log(`Payment failed for subscription ${subscriptionId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!existingSub) break

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            canceled_at: new Date().toISOString(),
          } as any)
          .eq('organization_id', existingSub.organization_id)

        console.log(`Subscription cancelled: ${subscription.id}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!existingSub) break

        const updates: Record<string, unknown> = {
          cancel_at_period_end: subscription.cancel_at_period_end,
        }

        if (subscription.status === 'active') {
          updates.status = 'active'
          updates.current_period_start = new Date(subscription.current_period_start * 1000).toISOString()
          updates.current_period_end = new Date(subscription.current_period_end * 1000).toISOString()
        }

        await supabase
          .from('subscriptions')
          .update(updates as any)
          .eq('organization_id', existingSub.organization_id)

        console.log(`Subscription updated: ${subscription.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
